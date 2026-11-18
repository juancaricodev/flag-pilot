# API Specification — Metrics

## Purpose

Provide read-only access to evaluation metrics for the Dashboard. The `metrics` module is separate from the `evaluation` module — evaluation handles writes (SDK-facing, unauthed), metrics handles reads (Dashboard-facing, authed). Both modules query the same `evaluations` table with different responsibilities.

## Requirements

### Requirement: GET /api/metrics endpoint

The API MUST expose a `GET /api/metrics` endpoint in the `metrics` module, protected by AuthGuard, returning evaluation metrics for all flags.

| Scenario        | GIVEN                                  | WHEN               | THEN                                                                          |
| --------------- | -------------------------------------- | ------------------ | ----------------------------------------------------------------------------- |
| Has evaluations | Valid JWT cookie AND evaluations exist | `GET /api/metrics` | Status 200, `MetricsSummary` object with `totalEvaluations` and `flags` array |
| No evaluations  | Valid JWT cookie AND no evaluations    | `GET /api/metrics` | Status 200, `{ totalEvaluations: 0, flags: [] }`                              |
| Unauthenticated | No valid JWT cookie                    | `GET /api/metrics` | Status 401                                                                    |

### Requirement: MetricsSummary response shape

The `GET /api/metrics` endpoint MUST return a response conforming to the `MetricsSummary` interface.

| Scenario           | GIVEN                                                         | WHEN              | THEN                                                                                                        |
| ------------------ | ------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------- |
| Total count        | 1500 evaluations across all flags                             | Response returned | `totalEvaluations` equals `1500`                                                                            |
| Per-flag breakdown | Flag "new-checkout" has 500 evals (300 enabled, 200 disabled) | Response returned | `flags` array contains entry with `flagName: "new-checkout"`, `total: 500`, `enabled: 300`, `disabled: 200` |
| Empty state        | No evaluations exist                                          | Response returned | `totalEvaluations: 0` AND `flags: []`                                                                       |

### Requirement: MetricsService.getMetrics() (API)

`MetricsService` MUST provide `getMetrics()` that queries the `evaluations` table via Prisma, groups by `flagId`, and returns aggregated counts. This is a read-only service in the `metrics` module (separate from `EvaluationService` which handles writes).

| Scenario           | GIVEN                                | WHEN           | THEN                                                          |
| ------------------ | ------------------------------------ | -------------- | ------------------------------------------------------------- |
| Groups by flag     | Multiple flags with evaluations      | `getMetrics()` | Returns one entry per flag with aggregated counts             |
| Includes flag name | Evaluations exist for flags          | `getMetrics()` | Each entry includes `flagName` from the related `Flag` record |
| Ordered by total   | Multiple flags with different counts | `getMetrics()` | Flags ordered by total evaluations descending                 |
| Empty DB           | No evaluations                       | `getMetrics()` | Returns `{ totalEvaluations: 0, flags: [] }`                  |

### Requirement: MetricsSummary shared type

`packages/shared` MUST export `MetricsSummary` and `FlagMetrics` interfaces.

| Scenario            | GIVEN                                      | WHEN      | THEN                                               |
| ------------------- | ------------------------------------------ | --------- | -------------------------------------------------- |
| Backward compatible | Existing code imports from `@fp/shared`    | Compiles  | TypeScript MUST NOT error — new types are additive |
| Types exported      | `MetricsSummary` and `FlagMetrics` defined | Importing | Both types available from `@fp/shared`             |

### Requirement: Cache-aside evaluation reads (UC-09, UC-10)

`EvaluationService` MUST resolve flag config via a Redis cache-aside read: key `flag:{name}`, value the resolved FlagConfig (`id`, `enabled`, `rolloutPct`, `whitelist`). A miss MUST read the DB and store the config; a hit MUST serve the cache without a DB read. A missing flag MUST return `false` and MUST NOT be cached.

| Scenario     | GIVEN                                      | WHEN                                                | THEN                                                 |
| ------------ | ------------------------------------------ | --------------------------------------------------- | ---------------------------------------------------- |
| Cache miss   | Key `flag:new-checkout` absent, flag in DB | `POST /api/evaluate` with `{"flag":"new-checkout"}` | DB config stored at `flag:new-checkout` and returned |
| Cache hit    | `flag:new-checkout` holds a FlagConfig     | Same request                                        | Cached config served, no DB read                     |
| Missing flag | "unknown-flag" absent from DB and cache    | Evaluate "unknown-flag"                             | Returns `false`, no key written                      |

### Requirement: Cache TTL

Cached flag config MUST expire 30 seconds after storage; an expired entry MUST be treated as a miss and refreshed from the DB.

| Scenario   | GIVEN                                      | WHEN           | THEN                                         |
| ---------- | ------------------------------------------ | -------------- | -------------------------------------------- |
| TTL expiry | `flag:new-checkout` stored 30+ seconds ago | Flag evaluated | Entry expired → DB read → fresh value stored |

### Requirement: Eager invalidation on flag mutations (UC-01, UC-03, UC-04)

`FlagsService` MUST delete `flag:{name}` when a flag is created or removed. On update it MUST delete both old and new `flag:{name}` keys (rename-safe).

| Scenario                | GIVEN                      | WHEN                        | THEN                                             |
| ----------------------- | -------------------------- | --------------------------- | ------------------------------------------------ |
| Update invalidates      | `flag:new-checkout` cached | Flag updated                | Key deleted; next evaluation is a miss           |
| Rename invalidates both | `flag:old-name` cached     | Flag renamed to "new-name"  | Keys `flag:old-name` AND `flag:new-name` deleted |
| Create invalidates      | `flag:new-checkout` cached | Flag "new-checkout" created | Key `flag:new-checkout` deleted                  |
| Remove invalidates      | `flag:old-feature` cached  | Flag "old-feature" removed  | Key `flag:old-feature` deleted                   |

### Requirement: Redis-down degradation

When Redis is unavailable, evaluation MUST degrade to a cache miss: cache errors MUST be caught, fall back to the DB, and MUST NOT throw or return an error.

| Scenario          | GIVEN                                | WHEN           | THEN                         |
| ----------------- | ------------------------------------ | -------------- | ---------------------------- |
| Redis unavailable | Redis unreachable, flag exists in DB | Flag evaluated | Succeeds via DB read, no 5xx |

### Requirement: Evaluation event recording on cache hits

Every evaluation MUST record an `Evaluation` event via `recordEvaluation`, cache hits included; caching MUST NOT bypass recording.

| Scenario           | GIVEN                      | WHEN                              | THEN                                     |
| ------------------ | -------------------------- | --------------------------------- | ---------------------------------------- |
| Cache hit recorded | `flag:new-checkout` cached | Flag evaluated, served from cache | `Evaluation` row written, correct result |

### Requirement: Cache configuration

The API MUST configure the cache via `REDIS_URL` and MUST scope keys under the `flag` namespace.

| Scenario           | GIVEN           | WHEN           | THEN                                     |
| ------------------ | --------------- | -------------- | ---------------------------------------- |
| Configured via env | `REDIS_URL` set | API bootstraps | Cache connects; keys namespaced `flag:*` |

### Requirement: Evaluation latency

Cache-hit evaluations SHOULD complete under 50ms (p95), including lookup and event recording.

| Scenario          | GIVEN                      | WHEN        | THEN                   |
| ----------------- | -------------------------- | ----------- | ---------------------- |
| Cache-hit latency | 1000 cache-hit evaluations | Measure p95 | p95 latency under 50ms |

### Requirement: Bounded staleness

After a flag mutation, stale values MUST NOT be served beyond the 30-second TTL window.

| Scenario            | GIVEN              | WHEN                        | THEN                                 |
| ------------------- | ------------------ | --------------------------- | ------------------------------------ |
| Stale window capped | Flag updated at T0 | Flag evaluated after T0+30s | Fresh value served, stale entry gone |

### Requirement: Cache infrastructure

The production deployment MUST provide Redis via a `redis:7-alpine` service — no exposed port, `maxmemory 64mb`, no persistence volume; the API MUST remain functional when it is down.

| Scenario           | GIVEN                             | WHEN             | THEN                                                             |
| ------------------ | --------------------------------- | ---------------- | ---------------------------------------------------------------- |
| Prod Redis service | `docker-compose.prod.yml` applied | Inspect services | Redis 4th service, no published ports, 64mb maxmemory, no volume |

### Requirement: E2E cache isolation

API end-to-end tests MUST use a fresh Redis container per run and unique flag names to avoid cross-run cache pollution.

| Scenario       | GIVEN                     | WHEN               | THEN                                                            |
| -------------- | ------------------------- | ------------------ | --------------------------------------------------------------- |
| Isolated cache | Prior run cached `flag:x` | New e2e run starts | Fresh container and unique names prevent stale-cache assertions |
