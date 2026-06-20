# Tasks: Flag Pilot MVP

## Phase 1: Foundation

- [ ] 1.1 Initialize pnpm workspace with `pnpm-workspace.yaml` and root `package.json`
- [ ] 1.2 Create `packages/shared/` with TypeScript types: `Flag`, `AuditLogEntry`, `Evaluation`, `ApiResponse`
- [ ] 1.3 Configure Turborepo (`turbo.json`) with build/lint/test pipelines
- [ ] 1.4 Generate `apps/api/` with NestJS CLI, configure tsconfig paths
- [ ] 1.5 Generate `apps/dashboard/` with Next.js CLI, configure App Router
- [ ] 1.6 Set up Prisma: install, create `schema.prisma` with `Flag`, `AuditLog`, `Evaluation` models
- [ ] 1.7 Run initial migration and create seed script with test data

## Phase 2: API — Flags CRUD

- [ ] 2.1 Create `flags` module: controller, service, DTOs for `POST/GET/PATCH/DELETE /api/flags`
- [ ] 2.2 Implement `FlagRepository` interface and `PrismaFlagRepository`
- [ ] 2.3 Implement `CreateFlag` use case with duplicate name validation (UC-01)
- [ ] 2.4 Implement `ListFlags` and `GetFlag` use cases (UC-02)
- [ ] 2.5 Implement `ToggleFlag` use case — enable/disable (UC-03)
- [ ] 2.6 Implement `UpdateFlag` use case — rollout percentage + whitelist (UC-06, UC-07)
- [ ] 2.7 Implement `DeleteFlag` use case (UC-04)
- [ ] 2.8 Wire audit logging on every flag mutation (UC-05)

## Phase 3: API — Evaluation

- [ ] 3.1 Implement `POST /api/evaluate` — evaluate by flag name, no user context (UC-09)
- [ ] 3.2 Implement `POST /api/evaluate/context` — evaluate with userId, whitelist check, rollout hash (UC-10)
- [ ] 3.3 Implement sticky rollout logic: `hashCode(userId + flagId) % 100 < rolloutPct`
- [ ] 3.4 Add Redis cache-aside layer with 30s TTL for evaluation results
- [ ] 3.5 Record `Evaluation` event on every evaluation call (UC-08 metrics)

## Phase 4: API — Auth

- [ ] 4.1 Implement `POST /api/auth/login` with email/password validation
- [ ] 4.2 Generate JWT with `jsonwebtoken`, set as httpOnly cookie
- [ ] 4.3 Create `AuthGuard` to protect admin routes
- [ ] 4.4 Implement `POST /api/auth/logout` — clear cookie

## Phase 5: Dashboard

- [ ] 5.1 Create login page with email/password form
- [ ] 5.2 Create flags list page (Server Component with data fetching)
- [ ] 5.3 Create create/edit flag form (Client Component)
- [ ] 5.4 Add toggle switch to enable/disable flags inline
- [ ] 5.5 Add audit log timeline component per flag (UC-05)
- [ ] 5.6 Add basic metrics display — evaluation count (UC-08)

## Phase 6: CI/CD

- [ ] 6.1 Create `.github/workflows/ci.yml` — lint, typecheck, test, build on PR
- [ ] 6.2 Create `.github/workflows/cd.yml` — build + deploy on merge to main

## Phase 7: Testing

- [ ] 7.1 Unit tests for evaluation logic (whitelist, rollout, sticky hash)
- [ ] 7.2 Unit tests for flags CRUD service
- [ ] 7.3 Integration tests for API endpoints (flags + evaluation)
- [ ] 7.4 E2E test: login → create flag → toggle → verify evaluation
