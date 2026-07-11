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
