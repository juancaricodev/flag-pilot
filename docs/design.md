# Flag Pilot — Technical Design

> **Status**: Draft v1
> **Date**: 2026-06-19
> **Based on**: PRD v1

---

## 1. Technical Approach

Monorepo with Turborepo + pnpm workspaces. Two applications (Next.js Dashboard, NestJS API) and a shared types package. Flag evaluation with Redis cache layer (cache-aside) to meet <50ms latency target. PostgreSQL persistence via Prisma ORM.

---

## 2. Architecture Decisions

### 2.1 Monorepo Tool

| Option        | Decision                                      |
| ------------- | --------------------------------------------- |
| **Turborepo** | ✅ Selected                                   |
| Nx            | ❌ Overkill for 2 apps, double learning curve |

**Rationale**: Turborepo is lightweight, integrates natively with pnpm workspaces, and comes from the Vercel ecosystem (Next.js). For a 2-app portfolio project, Nx adds unnecessary complexity.

### 2.2 ORM

| Option     | Decision                              |
| ---------- | ------------------------------------- |
| **Prisma** | ✅ Selected                           |
| Drizzle    | ❌ Assumes SQL knowledge, less mature |

**Rationale**: Declarative schema as living documentation, auto-generated migrations, native type safety, Prisma Studio for debugging.

### 2.3 Evaluation Cache

| Option    | Decision                       |
| --------- | ------------------------------ |
| **Redis** | ✅ Selected                    |
| No cache  | ❌ Won't meet <50ms under load |

**Rationale**: Cache-aside pattern — if Redis is unavailable, fall back to PostgreSQL without breaking the system.

### 2.4 Backend Architecture

| Option                     | Decision                                     |
| -------------------------- | -------------------------------------------- |
| **Screaming Architecture** | ✅ Selected (v1)                             |
| Clean / Hexagonal          | ⏳ Evaluate for v2 if complexity warrants it |

**Rationale**: Screaming Architecture organizes by domain (`flags/`, `audit/`, `auth/`) — the code screams what it does. It's simple, obvious, and sufficient for an MVP. If it grows, we can add internal layers without changing the folder structure.

### 2.5 Dashboard Authentication

| Option                    | Decision    |
| ------------------------- | ----------- |
| **JWT + httpOnly cookie** | ✅ Selected |

**Rationale**: Stateless, simple, no DB sessions needed. For v1 with a single admin, it's sufficient. Refresh tokens can be added later if needed.

### 2.6 Frontend Rendering

| Option                 | Decision    |
| ---------------------- | ----------- |
| **Next.js App Router** | ✅ Selected |

**Rationale**: Server Components for data fetching (flag lists), Client Components for interactivity (toggles, forms). Best of both worlds.

---

## 3. Project Structure

```
flag-pilot/
├── apps/
│   ├── dashboard/            # Next.js (Admin UI)
│   │   └── src/
│   │       └── app/
│   │           ├── login/
│   │           ├── flags/
│   │           └── page.tsx
│   └── api/                  # NestJS (REST API)
│       └── src/
│           ├── flags/
│           │   ├── flags.controller.ts
│           │   ├── flags.service.ts
│           │   └── flags.module.ts
│           ├── audit/
│           ├── auth/
│           └── evaluation/
├── packages/
│   └── shared/               # Shared TypeScript types
│       └── src/
│           ├── flag.ts
│           ├── user.ts
│           └── audit.ts
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## 4. Data Model (Prisma)

```prisma
model Flag {
  id          String       @id @default(cuid())
  name        String       @unique
  description String?
  enabled     Boolean      @default(false)
  rolloutPct  Int          @default(0)       // 0-100
  whitelist   String[]                       // user IDs
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  audits      AuditLog[]
  evaluations Evaluation[]
}

model AuditLog {
  id        String   @id @default(cuid())
  flagId    String
  flag      Flag     @relation(fields: [flagId], references: [id])
  action    String                     // "CREATE" | "TOGGLE" | "UPDATE" | "DELETE"
  fromState String?
  toState   String?
  reason    String?
  createdAt DateTime @default(now())
}

model Evaluation {
  id        String   @id @default(cuid())
  flagId    String
  flag      Flag     @relation(fields: [flagId], references: [id])
  userId    String?
  result    Boolean
  createdAt DateTime @default(now())
}
```

---

## 5. API Endpoints

### Admin (Dashboard)

| Method   | Path                   | Description                        |
| -------- | ---------------------- | ---------------------------------- |
| `POST`   | `/api/flags`           | Create flag                        |
| `GET`    | `/api/flags`           | List flags                         |
| `GET`    | `/api/flags/:id`       | Get flag                           |
| `PATCH`  | `/api/flags/:id`       | Update flag (toggle, %, whitelist) |
| `DELETE` | `/api/flags/:id`       | Delete flag                        |
| `GET`    | `/api/flags/:id/audit` | Change history                     |

### Evaluation (SDK)

| Method | Path                    | Description                     |
| ------ | ----------------------- | ------------------------------- |
| `POST` | `/api/evaluate`         | Evaluate flag by name           |
| `POST` | `/api/evaluate/context` | Evaluate flag with user context |

### Auth

| Method | Path               | Description |
| ------ | ------------------ | ----------- |
| `POST` | `/api/auth/login`  | Sign in     |
| `POST` | `/api/auth/logout` | Sign out    |

---

## 6. Data Flow — Flag Evaluation

```
SDK Client                    API (NestJS)                  Redis              PostgreSQL
    │                             │                          │                    │
    │  POST /api/evaluate         │                          │                    │
    │  { flag: "new-checkout" }   │                          │                    │
    │────────────────────────────►│                          │                    │
    │                             │  GET flag:new-checkout   │                    │
    │                             │─────────────────────────►│                    │
    │                             │                          │                    │
    │                             │  ◄── CACHED? ───────────│ (TTL: 30s)          │
    │                             │        │                 │                    │
    │                             │     NO ──────────────────────────────────────►│
    │                             │                          │                    │
    │                             │  ◄── flag data ─────────│────────────────────│
    │                             │                          │                    │
    │                             │  SET flag:new-checkout   │                    │
    │                             │─────────────────────────►│                    │
    │                             │                          │                    │
    │  ◄── { enabled: true } ─────│                          │                    │
    │                             │                          │                    │
```

---

## 7. Testing Strategy

| Layer           | What to Test                                       | How                                     |
| --------------- | -------------------------------------------------- | --------------------------------------- |
| **Unit**        | Services, evaluation logic (percentage, whitelist) | Jest, Prisma/Redis mocks                |
| **Integration** | REST endpoints, auth flow, DB queries              | Supertest + testcontainers (PostgreSQL) |
| **E2E**         | Full Dashboard (login → create flag → toggle)      | Playwright                              |

---

## 8. Migration / Rollout

No data migration required (greenfield project). Rollout plan:

1. Monorepo setup + base infrastructure
2. DB schema + seed test data
3. API endpoints (admin + evaluation)
4. Dashboard UI
5. Redis caching layer

---

## 9. Open Questions

- [ ] **Polling vs SSE** — How should the Dashboard reflect changes in real time? Evaluate Server-Sent Events vs simple polling.
- [ ] **Prisma connect timeout** — Pool size configuration for PostgreSQL.
- [ ] **Deploy target** — AWS (ECS? Lambda? EC2?) — decide later.
- [x] **Tests from day one** — Resolved: YES. Unit tests for existing code written (37 tests, covering UC-01 through UC-10). TDD for all new code going forward.
