# Flag Pilot API

Feature flag management REST API built with NestJS, Prisma, PostgreSQL, and Redis.

## Tech Stack

- **Framework**: NestJS 11
- **ORM**: Prisma 6
- **Database**: PostgreSQL
- **Cache**: Redis (via `@nestjs/cache-manager` + Keyv)
- **Language**: TypeScript (strict)
- **Testing**: Jest 30 + supertest + testcontainers

## Architecture

- **Screaming Architecture** — the folder structure names the domains, not the frameworks
- **Two layers per module** — `presentation/` (controller, DTOs, guards) and `application/` (service)
- **SDD (Spec-Driven Development)** — specifications before code

There is no abstract repository layer: services inject `PrismaService` directly (`PrismaModule` is `@Global()`). Domain types are produced by explicit mappers (`toFlag()`, `toEntry()`).

## Project Structure

```
src/
├── flags/           # Feature flag CRUD + audit logging on mutations
│   ├── presentation/    # Controller, DTOs
│   └── application/     # FlagsService
├── evaluation/      # Public evaluation API (no auth)
├── audit/           # Audit log queries
├── metrics/         # Evaluation metrics
├── auth/            # JWT login/logout + AuthGuard
├── flag-cache/      # Redis cache-aside wrapper (key format, TTL, serialization)
├── prisma/          # PrismaService + module (global)
├── app.module.ts    # Root module: CacheModule, Prisma, feature modules
└── main.ts          # cookie-parser, morgan, global ValidationPipe
```

Each domain module follows the same shape:

| Directory       | Role                        | Files                    |
| --------------- | --------------------------- | ------------------------ |
| `presentation/` | Interface adapters (NestJS) | Controller, DTOs, Guards |
| `application/`  | Business logic (use cases)  | Service                  |

## Getting Started

```bash
# From the repo root — install workspace dependencies
pnpm install

# Start PostgreSQL (Redis is optional for local development)
docker compose up -d

# From apps/api
pnpm exec prisma migrate deploy
pnpm exec prisma db seed      # admin@flagpilot.dev / admin123
pnpm start:dev
```

The server listens on `PORT` (default `3001`).

## Environment Variables

```env
# PostgreSQL — consumed by Prisma
DATABASE_URL=postgresql://flag_pilot:flag_pilot_dev@localhost:5432/flag_pilot

# Redis — defaults to redis://localhost:6379
REDIS_URL=redis://localhost:6379

# JWT signing secret — the fallback is for local development only
JWT_SECRET=change-me

# HTTP port — defaults to 3001
PORT=3001
```

The JWT lifetime is fixed at 7 days in `auth.module.ts` (not configurable by env var).

## API Endpoints

The evaluation endpoints are public. Everything under `/api/flags`, `/api/audit`, and `/api/metrics` requires the auth cookie.

| Method | Endpoint                | Description                                           |
| ------ | ----------------------- | ----------------------------------------------------- |
| GET    | `/health`               | Health check — `{ "status": "ok" }`                   |
| POST   | `/api/auth/login`       | Login — sets an httpOnly JWT cookie (7 days)          |
| POST   | `/api/auth/logout`      | Logout — clears the cookie                            |
| GET    | `/api/flags`            | List all flags                                        |
| POST   | `/api/flags`            | Create a flag                                         |
| GET    | `/api/flags/:id`        | Get a single flag                                     |
| PATCH  | `/api/flags/:id`        | Update a flag (toggle, rollout percentage, whitelist) |
| DELETE | `/api/flags/:id`        | Delete a flag                                         |
| GET    | `/api/flags/:id/audit`  | Audit entries for one flag                            |
| GET    | `/api/audit`            | All audit entries                                     |
| GET    | `/api/metrics`          | Global evaluation metrics                             |
| POST   | `/api/evaluate`         | Evaluate a flag by name                               |
| POST   | `/api/evaluate/context` | Evaluate a flag for a `userId` (whitelist + rollout)  |

## Evaluation and Caching

`POST /api/evaluate/context` applies two rules in order:

1. If the `userId` is in the flag's whitelist → enabled.
2. Otherwise a sticky hash of `userId + flagId` modulo 100 is compared against `rolloutPct`.

Reads go through `FlagCacheService`, a cache-aside wrapper with a 30s TTL. Flag mutations invalidate the key eagerly, and any Redis failure degrades to a cache miss — evaluation never fails because the cache is down.

## Testing

```bash
# Unit tests
pnpm test

# E2E tests (requires Docker — testcontainers starts PostgreSQL and Redis)
pnpm test:e2e

# Coverage
pnpm test:cov
```

Unit tests are co-located with the source (`*.spec.ts`). E2E suites live in `test/` (`*.e2e-spec.ts`).

## Database

```bash
pnpm exec prisma migrate deploy   # Apply pending migrations
pnpm exec prisma migrate dev      # Create a migration during development
pnpm exec prisma generate         # Regenerate the client
pnpm exec prisma db seed          # Seed admin + demo flags
```

## Deployment

```bash
# Build the image (multi-stage, from apps/api)
docker build -t flag-pilot-api .

# Production stack: postgres + redis + api (from the repo root)
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
```

## Learn More

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
