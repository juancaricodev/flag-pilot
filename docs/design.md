# Flag Pilot — Technical Design

> **Status**: Draft v2
> **Date**: 2026-07-02
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

### 2.7 Dashboard Mutations — Server Actions

| Option                             | Decision                       |
| ---------------------------------- | ------------------------------ |
| **Server Actions**                 | ✅ Selected                    |
| Fetch from client + proxy          | ❌ mixes responsibilities      |
| Server Actions + Server Components | ✅ all network logic on server |

**Rationale**: Server Actions allow the visual component to call a function as if it were local (`toggleFlag(id, enabled)`) without knowing about HTTP, cookies, or an API. All network logic resides on the server. The browser never touches the API directly — neither for reads nor for mutations.

This eliminates the need for a Next.js proxy (`rewrites`) because all API communication is server-to-server.

**Mutation flow:**

```
Browser                  Next.js Server                    API (3000)
   │                          │                                │
   │ Click toggle             │                                │
   │ POST /_next/actions ────►│                                │
    │ { id, args }             │   Server Action                │
   │                          │   - reads cookie from request  │
   │                          │   - fetch PATCH /api/flags/:id │
   │                          │   - Cookie: access_token=...   │
   │                          │──────────────────────────────►│
   │                          │◄───────── 200 ────────────────│
   │◄── response ────────────│                                │
```

### 2.8 Design System

| Option                        | Decision                                                        |
| ----------------------------- | --------------------------------------------------------------- |
| **CSS Modules + SCSS**        | ✅ Selected                                                     |
| Tailwind CSS                  | ❌ Rejected — CSS Modules preferred over utility-first approach |
| CSS-in-JS (styled-components) | ❌ runtime overhead, rejected                                   |

**Rationale**: CSS Modules provide automatic scoping without BEM. SCSS provides variables, mixins, and nesting. Tokens are defined as CSS Custom Properties (not SCSS variables) to allow future migration to Tailwind without changing references, and to be overridable by theme (dark mode).

**Atomic Design:**

| Level         | Role                                             |
| ------------- | ------------------------------------------------ |
| **Atoms**     | Base components: Button, Input, Badge            |
| **Molecules** | Atom combinations: FlagCard, FlagForm, LoginForm |
| **Organisms** | Complex modules: Sidebar                         |
| **Templates** | The pages themselves (`app/`)                    |

**Palette — Slate & Sky:**

```scss
:root {
  --bg: #ffffff;
  --bg-subtle: #fafafa;
  --bg-muted: #f5f5f5;
  --border: #e5e5e5;
  --border-hover: #d4d4d4;
  --text: #171717;
  --text-secondary: #525252;
  --text-muted: #a3a3a3;
  --accent: #2563eb;
  --accent-hover: #1d4ed8;
  --success: #16a34a;
  --danger: #dc2626;
  --warning: #d97706;
}
```

### 2.9 Dashboard Auth Flow

| Option                    | Decision                         |
| ------------------------- | -------------------------------- |
| **JWT + httpOnly cookie** | ✅ Selected                      |
| Next.js proxy check       | ✅ Selected                      |
| Server Action for login   | ✅ Selected                      |
| Proxy for sharing cookie  | ❌ Not needed (server-to-server) |

**Authentication flow:**

```
                   ┌──────────────┐
                   │  Request     │
                   │  to /flags   │
                   └──────┬───────┘
                          │
                   ┌──────▼───────┐
                   │ Proxy        │
                   │ reads cookie │     NO
                   │ access_token │────────► redirect /login
                   └──────┬───────┘
                          │ YES
                   ┌──────▼───────┐
                   │ Server       │
                   │ Component    │
                   │ reads cookie │
                   │ → fetch API  │
                   └──────────────┘
```

**Login Server Action:**

1. Client Component (form) calls `login(email, password)` Server Action
2. Server Action performs `POST /api/auth/login` to the API
3. API responds with JWT
4. Server Action sets httpOnly cookie via `cookies().set('access_token', jwt, { httpOnly: true, secure, sameSite })`
5. Server Action returns success → component redirects to `/flags`

### 2.10 Toggle Switch Implementation

The toggle switch is built inline in the FlagCard molecule (not extracted as an Atom) to keep the scope small. It uses:

- **`<button role="switch" aria-checked>`** — ARIA switch pattern, accessible by default with keyboard navigation
- **`window.confirm()`** — lightweight confirmation dialog for MVP. A custom modal is tracked as a post-MVP UX enhancement
- **`updateTag('flags')` + `refresh()`** — Next.js 16 cache invalidation. `updateTag` replaces the deprecated `revalidateTag(tag, profile)` pattern which required a cache profile with staleness windows. `refresh()` ensures the client router cache is also invalidated

**Mutation flow:**

```
Browser                  Next.js Server                    API (3000)
   │                          │                                │
   │ Click toggle             │                                │
   │ window.confirm()         │                                │
   │ (if cancelled → no-op)   │                                │
   │                          │                                │
   │ POST /_next/actions ────►│                                │
   │ { flagId, enabled }      │   Server Action                │
   │                          │   - reads cookie from request  │
   │                          │   - fetch PATCH /api/flags/:id │
   │                          │   - Cookie: access_token=...   │
   │                          │──────────────────────────────►│
   │                          │◄───────── 200 ────────────────│
   │                          │   - updateTag('flags')         │
   │                          │   - refresh()                  │
   │◄── re-render ───────────│                                │
```

### 2.11 Flag Status Computation

The `Flag` type in `packages/shared` includes a computed `status` field (`'disabled' | 'partial' | 'enabled'`) that is NOT stored in the database. It's derived at runtime by the API:

```
disabled → enabled: false (any rolloutPct)
partial  → enabled: true AND 0 < rolloutPct < 100
enabled  → enabled: true AND rolloutPct is 0 or 100
```

**Rationale**: The status is a derived projection of two existing fields (`enabled` + `rolloutPct`). Storing it would create a synchronization problem (what happens when `rolloutPct` changes but `status` doesn't?). Computing it in `toFlag()` keeps the data model normalized and eliminates sync bugs.

**Location**: `apps/api/src/flags/application/flags.service.ts` — `computeStatus()` method called inside `toFlag()`.

### 2.11 Database Naming Convention

| Convention     | Decision                             |
| -------------- | ------------------------------------ |
| **snake_case** | ✅ Selected (tables + columns in DB) |
| camelCase      | ✅ Selected (TypeScript Prisma API)  |

**Rationale**: PostgreSQL convention dictates `snake_case` for schema objects (`flags`, `created_at`, `rollout_pct`). Prisma's `@map()` (column) and `@@map()` (table) directives bridge the gap — the TypeScript API stays in idiomatic `camelCase` while the actual SQL uses `snake_case`. This means `prisma.flag.findMany()` generates SQL against the `flags` table, and `flag.createdAt` maps to the `created_at` column. Zero runtime overhead, no manual SQL writing needed.

---

## 3. Project Structure

```
flag-pilot/
├── apps/
│   ├── dashboard/                    # Next.js 16 (Admin UI)
│   │   └── src/
│   │       ├── app/
│   │       │   ├── layout.tsx              # RootLayout
│   │       │   ├── page.tsx                # Home (redirects to /flags or /login)
│   │       │   ├── login/
│   │       │   │   └── page.tsx            # Login page
│   │       │   └── (dashboard)/            # Route group (protected)
│   │       │       ├── layout.tsx          # Sidebar + content flex layout
│   │       │       ├── flags/page.tsx      # Flags list grid
│   │       │       ├── flags/new/page.tsx  # Create flag form
│   │       │       ├── flags/[id]/edit/    # Edit + delete flag
│   │       │       ├── audit/page.tsx      # Audit log timeline
│   │       │       └── metrics/page.tsx    # Metrics display page
│   │       ├── components/
│   │       │   ├── atoms/                  # Base components
│   │       │   │   ├── Button/
│   │       │   │   ├── Input/
│   │       │   │   └── Badge/
│   │       │   ├── molecules/              # Atom combinations
│   │       │   │   ├── FlagCard/           # Flag display + toggle + edit link
│   │       │   │   ├── FlagForm/           # Create/edit flag form
│   │       │   │   ├── LoginForm/
│   │       │   │   ├── AuditEntry/         # Audit log timeline row
│   │       │   │   └── MetricsSummary/     # Metrics total count display
│   │       │   └── organisms/
│   │       │       ├── Sidebar/            # Navigation sidebar
│   │       │       └── MetricsTable/       # Per-flag metrics table
│   │       ├── actions/                    # Server Actions
│   │       │   ├── auth.ts                 # login / logout
│   │       │   └── flags.ts                # create / toggle / update / delete
│   │       ├── data/
│   │       │   ├── flags.ts                # Data fetchers (getFlags, getFlag)
│   │       │   └── metrics.ts              # getMetrics() data fetcher
│   │       ├── styles/
│   │       │   ├── _tokens.scss            # CSS Custom Properties
│   │       │   ├── _mixins.scss            # Reusable mixins
│   │       │   └── globals.scss            # Reset + base styles
│   │       ├── utils/
│   │       │   └── formatDate.ts           # Date formatting
│   │       └── proxy.ts                    # Auth proxy (Next.js 16)
│   └── api/                                # NestJS 11 (REST API)
│       ├── prisma/
│       │   ├── schema.prisma               # DB models (Admin, Flag, AuditLog, Evaluation)
│       │   ├── migrations/                 # Prisma migrations
│       │   └── seed.ts                     # Seed script
│       ├── test/
│       │   ├── auth.e2e-spec.ts
│       │   ├── evaluate.e2e-spec.ts
│       │   ├── flags.e2e-spec.ts
│       │   └── helpers/
│       └── src/
│           ├── main.ts
│           ├── app.module.ts
│           ├── prisma/                     # PrismaModule + PrismaService
│           ├── flags/                      # Screaming Architecture module
│           │   ├── flags.module.ts
│           │   ├── presentation/
│           │   │   ├── flags.controller.ts
│           │   │   └── dtos/
│           │   └── application/
│           │       ├── flags.service.ts
│           │       └── flags.service.spec.ts
│           ├── audit/
│           │   ├── audit.module.ts
│           │   └── application/
│           ├── auth/
│           │   ├── auth.module.ts
│           │   ├── presentation/
│           │   │   ├── auth.controller.ts
│           │   │   ├── dtos/
│           │   │   └── guards/
│           │   └── application/
│           ├── metrics/                         # Metrics module (read-only, Dashboard-facing)
│           │   ├── metrics.module.ts
│           │   ├── presentation/
│           │   │   └── metrics.controller.ts
│           │   └── application/
│           │       ├── metrics.service.ts
│           │       └── metrics.service.spec.ts
│           └── evaluation/
│               ├── evaluation.module.ts
│               ├── presentation/
│               └── application/
├── packages/
│   └── shared/                             # @fp/shared — shared types
│       └── src/
│           ├── index.ts
│           ├── api.ts                      # ApiResponse wrappers
│           ├── audit.ts                    # AuditLogEntry
│           ├── evaluation.ts               # Evaluation types
│           ├── flag.ts                     # Flag, FlagStatus, CreateFlagInput, UpdateFlagInput
│           └── metrics.ts                  # MetricsSummary, FlagMetrics
├── docs/                                   # Portfolio-facing documentation
│   ├── PRD.md
│   ├── design.md
│   ├── specs.md
│   ├── tasks.md
│   └── post-mvp.md
├── openspec/
│   ├── config.yaml
│   └── specs/
│       ├── dashboard/spec.md
│       ├── api/
│       └── database/
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## 4. Data Model (Prisma)

> **Naming convention**: Database tables and columns use `snake_case` (PostgreSQL convention). Prisma `@map`/`@@map` directives bridge the gap — the TypeScript API stays in `camelCase` while the actual SQL schema uses `snake_case`.

```prisma
model Admin {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  createdAt    DateTime @default(now()) @map("created_at")

  @@map("admins")
}

model Flag {
  id          String       @id @default(cuid())
  name        String       @unique
  description String?
  enabled     Boolean      @default(false)
  rolloutPct  Int          @default(0)       @map("rollout_pct")   // 0-100
  whitelist   String[]
  createdAt   DateTime     @default(now())   @map("created_at")
  updatedAt   DateTime     @updatedAt        @map("updated_at")
  audits      AuditLog[]
  evaluations Evaluation[]

  @@map("flags")
}

model AuditLog {
  id        String   @id @default(cuid())
  flagId    String   @map("flag_id")
  flag      Flag     @relation(fields: [flagId], references: [id], onDelete: Cascade)
  action    String                                          // "CREATE" | "TOGGLE" | "UPDATE" | "DELETE"
  fromState String?  @map("from_state")
  toState   String?  @map("to_state")
  reason    String?
  createdAt DateTime @default(now()) @map("created_at")

  @@map("audit_logs")
}

model Evaluation {
  id        String   @id @default(cuid())
  flagId    String   @map("flag_id")
  flag      Flag     @relation(fields: [flagId], references: [id], onDelete: Cascade)
  userId    String?  @map("user_id")
  result    Boolean
  createdAt DateTime @default(now()) @map("created_at")

  @@map("evaluations")
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
| `GET`    | `/api/audit`           | Audit log timeline                 |
| `GET`    | `/api/metrics`         | Evaluation metrics summary         |

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

- [ ] **Polling vs SSE** — How should the Dashboard reflect changes in real time? Evaluate Server-Sent Events vs simple polling. Post-MVP.
- [ ] **Deploy target** — AWS (ECS? Lambda? EC2?) — decide when ready to deploy.
- [x] **Tests from day one** — Resolved: YES. Unit + integration tests for existing code (~124 dashboard + ~40 API unit + 25 API E2E = ~190 tests). TDD for all new code.
- [x] **Authentication method** — Resolved: JWT + httpOnly cookie. Login via Server Action in Dashboard.
- [x] **Cache invalidation** — Resolved: TTL-based (30s cache-aside). Pub/sub evaluated as overkill for v1.
- [x] **Server Actions vs fetch** — Resolved: Server Actions for all mutations. Server Components for data fetching. No proxy needed.
