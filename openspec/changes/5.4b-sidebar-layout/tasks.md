# Tasks: 5.4b Sidebar + Dashboard Layout

## Stage 1: Sidebar Organism

- [x] T-001: Create `Sidebar/types.ts` — `NavItem` interface (`label`, `href`), `NAV_ITEMS` constant with Flags/Audit Log/Metrics
- [x] T-002: Create `Sidebar/Sidebar.module.scss` — 260px sticky aside, brand text, nav link styles (active/hover via `--accent` tokens), divider, logout button bottom-anchored via `margin-top: auto`
- [x] T-003: Create `Sidebar/Sidebar.tsx` — `'use client'`, `usePathname()` for active detection, iterate `NAV_ITEMS`, `<form action={logout}>` with `Button variant="ghost"`
- [x] T-004: Create `Sidebar/index.ts` — barrel export for `Sidebar`
- [x] T-005: Create `organisms/index.ts` — barrel following `atoms/index.ts` pattern: `export { Sidebar } from './Sidebar'`
- [x] T-006: Create `Sidebar/Sidebar.test.tsx` — 7 tests: brand text, 3 nav links with correct hrefs, 3 active highlighting (Flags/Audit/Metrics), logout form renders

## Stage 2: Dashboard Layout + Placeholders

- [x] T-007: Create `(dashboard)/layout.module.scss` — `.layout { display:flex; min-height:100vh }`, `.main { flex:1; padding:var(--space-8); overflow-y:auto }`
- [x] T-008: Create `(dashboard)/layout.tsx` — Server Component, import Sidebar, render `<Sidebar />` + `<main>{children}</main>` in flex row
- [x] T-009: Create `(dashboard)/audit/page.tsx` — Server Component: "Audit Log" heading + "Coming soon" paragraph
- [x] T-010: Create `(dashboard)/metrics/page.tsx` — Server Component: "Metrics" heading + "Coming soon" paragraph

## Stage 3: Move Flags Page

- [ ] T-011: Move `src/app/flags/page.tsx` → `src/app/(dashboard)/flags/page.tsx` (no import changes — uses `@/` absolute paths)
- [ ] T-012: Move `src/app/flags/page.module.scss` → `src/app/(dashboard)/flags/page.module.scss`; remove `max-width:1200px` + `margin:0 auto` from `.page` (parent flex controls width)
- [ ] T-013: Delete `src/app/flags/` directory

## Stage 4: Verification

- [ ] T-014: Confirm proxy.ts already lists `/audit`, `/metrics` in `protectedRoutes` — no proxy changes needed
- [ ] T-015: Run `pnpm --filter dashboard test` — all existing + 7 new tests pass
- [ ] T-016: Run `pnpm --filter dashboard typecheck` — no type or import errors
- [ ] T-017: Manual check — `/flags`, `/audit`, `/metrics` render inside sidebar layout; `/login` has no sidebar
