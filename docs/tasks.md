# Tasks: Flag Pilot MVP

## Phase 1: Foundation

- [x] 1.1 Initialize pnpm workspace with `pnpm-workspace.yaml` and root `package.json`
- [x] 1.2 Create `packages/shared/` with TypeScript types: `Flag`, `AuditLogEntry`, `Evaluation`, `ApiResponse`
- [x] 1.3 Configure Turborepo (`turbo.json`) with build/lint/test pipelines
- [x] 1.4 Generate `apps/api/` with NestJS CLI, configure tsconfig paths
- [x] 1.5 Generate `apps/dashboard/` with Next.js CLI, configure App Router
- [x] 1.6 Set up Prisma: install, create `schema.prisma` with `Flag`, `AuditLog`, `Evaluation` models
- [x] 1.7 Run initial migration and create seed script with test data

## Phase 2: API — Flags CRUD

- [x] 2.1 Create `flags` module: controller, service, DTOs for `POST/GET/PATCH/DELETE /api/flags`
- [x] 2.2 Implement `FlagRepository` interface and `PrismaFlagRepository`
- [x] 2.3 Implement `CreateFlag` use case with duplicate name validation (UC-01)
- [x] 2.4 Implement `ListFlags` and `GetFlag` use cases (UC-02)
- [x] 2.5 Implement `ToggleFlag` use case — enable/disable (UC-03)
- [x] 2.6 Implement `UpdateFlag` use case — rollout percentage + whitelist (UC-06, UC-07)
- [x] 2.7 Implement `DeleteFlag` use case (UC-04)
- [x] 2.8 Wire audit logging on every flag mutation (UC-05)

## Phase 3: API — Evaluation

- [x] 3.1 Implement `POST /api/evaluate` — evaluate by flag name, no user context (UC-09)
- [x] 3.2 Implement `POST /api/evaluate/context` — evaluate with userId, whitelist check, rollout hash (UC-10)
- [x] 3.3 Implement sticky rollout logic: `hashCode(userId + flagId) % 100 < rolloutPct`
- [ ] 3.4 Add Redis cache-aside layer with 30s TTL for evaluation results
- [x] 3.5 Record `Evaluation` event on every evaluation call (UC-08 metrics)

## Phase 4: API — Auth

- [x] 4.1 Implement `POST /api/auth/login` with email/password validation
- [x] 4.2 Generate JWT with `@nestjs/jwt`, set as httpOnly cookie (7d expiry)
- [x] 4.3 Create `AuthGuard` to protect admin routes
- [x] 4.4 Implement `POST /api/auth/logout` — clear cookie

## Phase 5: Dashboard

- [x] 5.1 **Design System Foundation**
  - Install `sass`, create `src/styles/` with `_tokens.scss`, `_mixins.scss`, `globals.scss`
  - Update `RootLayout` — fonts, metadata, global styles
  - Remove Tailwind dependency (postcss, configs, boilerplate classes)
- [x] 5.2 **Auth proxy**
  - Create `src/proxy.ts` (Next.js 16 convention, replaces deprecated `middleware.ts`)
  - Read httpOnly cookie, redirect to `/login` if missing on protected routes
  - Configure `matcher` for protected routes
- [x] 5.3 **Login page**
  - Email/password form calling a Server Action
  - Server Action: POST `/api/auth/login` → extract JWT → set httpOnly cookie via `cookies().set()`
  - Redirect to `/flags` on success, show error message on failure
- [x] 5.4 **Flags list page** (Server Component)
  - Server Component fetch to `GET /api/flags` — pass cookie via headers
  - Render grid of `FlagCard` molecules
  - `FlagCard` is `'use client'` for the toggle button (pending 5.6)
- [x] 5.4a **Atom components** (see `openspec/specs/dashboard/spec.md`)
  - `Button` atom: primary/secondary/ghost variants, 8 tests
  - `Badge` atom: enabled/disabled/partial status colors, 5 tests
  - `Input` atom: label/error states, forwardRef, 7 tests
  - All atoms with SCSS modules, types, and tests
  - `FlagStatus` type (`'disabled' | 'partial' | 'enabled'`) added to `@fp/shared`
  - `status` field computed in API `toFlag()` via `computeStatus()`
  - Barrels export in `src/components/atoms/index.ts`
- [x] 5.4b **Navigation sidebar + layout update**
  - Sidebar organism: brand, nav links (Flags/Audit Log/Metrics), logout via Server Action
  - `(dashboard)` route group: flex layout (260px sidebar + main content)
  - Placeholder pages for `/audit` and `/metrics`
  - Flags page moved into route group (URL preserved at `/flags`)
  - Bugfix: LoginForm redirect moved from `startTransition` to `useEffect`
- [x] 5.5 **Create / Edit flag form** ✅
  - Server Actions: createFlag, updateFlag, deleteFlag, getFlag data fetcher
  - FlagForm molecule: useActionState, controlled inputs, client validation, rollout sync
  - Pages: /flags/new (create), /flags/[id]/edit (edit + delete danger zone)
  - FlagCard: edit link navigation
  - Bugfix: CreateFlagDto missing rolloutPct → 400 on POST
  - ✅ Typecheck, 124 tests, lint — all green
- [x] 5.6 **Toggle switch** — inline enable/disable ✅
  - Server Action: `toggleFlag(flagId, enabled)` — reads cookie, `PATCH /api/flags/:id`
  - Cache invalidation via `updateTag('flags')` + `refresh()` (Next.js 16 API)
  - FlagCard toggle: `<button role="switch" aria-checked>` with `window.confirm()` protection
  - CSS-only toggle (36x20px track + 16px thumb), loading state via `useState`
  - ✅ Typecheck, tests — all green
- [x] 5.7 **Audit log timeline** ✅
  - New `GET /api/audit` endpoint + `AuditService.findAll()`
  - `AuditEntry` molecule: colored timeline with action badge, description, timestamp
  - Server Component page at `/audit` with header, subtitle, timeline, empty state
  - ✅ Typecheck, 141 tests, lint — all green
- [x] 5.8 **Metrics display**
  - Server Component: fetch evaluation count from API
  - Display per-flag evaluation metrics and global summary

## Phase 6: CI/CD

- [x] 6.1 Create `.github/workflows/ci.yml` — lint, typecheck, test, build on PR
- [x] 6.2 Create `.github/workflows/cd.yml` — build + deploy on merge to main

## Phase 7: Testing

- [x] 7.1 Unit tests for evaluation logic (whitelist, rollout, sticky hash) — 21 tests
- [x] 7.2 Unit tests for flags CRUD service — 15 tests
- [x] 7.3 Integration tests for API endpoints (evaluate: 7, auth: 5, flags CRUD: 13 = 25 tests)
- [ ] 7.4 E2E test: login → create flag → toggle → verify evaluation
