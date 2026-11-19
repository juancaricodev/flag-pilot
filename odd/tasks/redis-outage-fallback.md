# Redis outage fallback (#15)

Restore evaluation from PostgreSQL when Redis is unavailable. Branch: `fix/redis-outage-fallback`.
Delivery: `single-pr` (~120 authored lines); runner: Jest + Supertest + Docker Testcontainers.

## Specs

- **S1** — “Entonces tenemos que solucionar este bug.” The reported result was `curl: (28) Operation timed out after 5006 milliseconds with 0 bytes received`. With a warmed cache and Redis unavailable, evaluation must still return HTTP 200 and the PostgreSQL value. Keep healthy Redis hits and invalidation working. Dashboard E2E 7.4 is separate.

## Tasks

- T1 · S1 · inline (one behavior); independent outage verification · verified locally, uncommitted · RED: 5,000 ms timeout; GREEN: 34 API E2E tests passed.

## Log

- **L1:** “Entonces tenemos que solucionar este bug. ¿Cómo procedemos? ¿Creamos el respectivo issue en GH?”
- **L2:** “Perfecto, continuemos” authorizes the local correction after the test-only RED checkpoint.
- **L3:** Keep the connection and inactivity bounds at the Redis transport. Reject offline commands rather than replaying stale cache operations after reconnect. Use heartbeat traffic to keep healthy idle sockets open. No public API or configuration changes.
- **L4:** GREEN: 94 API unit and 34 API E2E tests passed. Typecheck and Prettier passed. The E2E suite covers both paused Redis and Redis stopped after warming the cache.
- **L5:** Independent isolated probes confirmed the hard-stop fallback, healthy cache hits and invalidation, and that a write attempted while disconnected was not replayed upon recovery. No guarantee is made about commands already received by Redis.
