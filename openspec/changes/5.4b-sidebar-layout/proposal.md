# Proposal: 5.4b Sidebar + Dashboard Layout

## Intent

The dashboard has no navigation. Flags and Login render independently with no shared chrome. Users can't reach `/audit` or `/metrics` without typing URLs. This change introduces the first organism (Sidebar), a dashboard route group, and placeholder pages so the app feels navigable.

## Scope

### In Scope

- Sidebar organism (`src/components/organisms/Sidebar/`) with nav links (Flags, Audit Log, Metrics), active link highlighting via `usePathname()`, and logout via Server Action `<form action={logout}>`
- Dashboard route group `src/app/(dashboard)/` with layout (sidebar 260px + content area flex)
- Placeholder pages for `/audit` and `/metrics` ("Coming soon")
- Move `src/app/flags/` → `src/app/(dashboard)/flags/` (URL unchanged)
- Barrel `src/components/organisms/index.ts`
- Co-located Sidebar tests (5–8 tests)

### Out of Scope

- Toggle switch (5.6), Create/Edit form (5.5), real audit timeline (5.7), real metrics (5.8)
- Collapsible sidebar / mobile hamburger menu
- Icons for nav items (future improvement)
- Changes to auth logic, proxy, atoms, molecules, or design tokens

## Capabilities

### New Capabilities

- `dashboard/sidebar`: Navigation sidebar organism with active link highlighting, logout button, and integration into a dashboard route group layout. Also covers placeholder pages for audit and metrics.

### Modified Capabilities

None — the existing `dashboard` spec (atoms) is unaffected.

## Approach

1. **Create** `src/components/organisms/Sidebar/` as a Client Component (`'use client'`) with `usePathname()` for active link detection. Accept no props — self-contained.
2. **Create** `src/app/(dashboard)/layout.tsx` — wraps children in flex container: `<Sidebar />` on the left, `<main>` content area on the right.
3. **Create** `src/app/(dashboard)/audit/page.tsx` and `.../metrics/page.tsx` as Server Components with placeholder copy.
4. **Move** `src/app/flags/` → `src/app/(dashboard)/flags/` — update import paths if needed, adjust `page.module.scss` for flex layout (remove `max-width` centering in favor of parent flex).
5. **Add** barrel exports: `Sidebar/index.ts`, `organisms/index.ts`.

Sidebar is Client Component only for `usePathname()` — all content is static. Logout uses existing `logout()` from `@/actions/auth` via `<form action={logout}>`.

## Affected Areas

| Area                                   | Impact      | Description                                       |
| -------------------------------------- | ----------- | ------------------------------------------------- |
| `src/components/organisms/Sidebar/`    | **New**     | Sidebar organism (tsx, scss, types, test, barrel) |
| `src/components/organisms/index.ts`    | **New**     | Organisms barrel                                  |
| `src/app/(dashboard)/layout.tsx`       | **New**     | Dashboard layout with sidebar                     |
| `src/app/(dashboard)/flags/`           | **Moved**   | From `src/app/flags/` (page + styles)             |
| `src/app/(dashboard)/audit/page.tsx`   | **New**     | Placeholder                                       |
| `src/app/(dashboard)/metrics/page.tsx` | **New**     | Placeholder                                       |
| `src/app/flags/`                       | **Removed** | Folder deleted after move                         |

## Risks

| Risk                                       | Likelihood | Mitigation                                                             |
| ------------------------------------------ | ---------- | ---------------------------------------------------------------------- |
| `redirect()` throw in logout breaks test   | Medium     | Follow existing pattern — mock `redirect()` in Sidebar tests           |
| Missing barrel exports cause import errors | Low        | Add `index.ts` for both Sidebar and organisms dir                      |
| Flag page styles break after move          | Low        | Convert `max-width: 1200px` centering to flex-based from parent layout |

## Rollback Plan

Revert is safe — no DB, API, or auth changes. Delete `(dashboard)/` route group, restore `src/app/flags/`, remove `organisms/` directory. All existing functionality untouched.

## Dependencies

- Existing `logout()` in `src/actions/auth.ts` — no changes needed
- Design tokens and mixins in `src/styles/` — sufficient as-is
- No new packages or dependencies

## Success Criteria

- [ ] Sidebar renders Flags, Audit Log, Metrics links — all navigate correctly
- [ ] Active link is highlighted (matches `usePathname()`)
- [ ] Logout button calls `logout()` and redirects to `/login`
- [ ] `/audit` and `/metrics` show placeholder pages (not 404)
- [ ] `/flags` still works at the same URL, content adjusts for sidebar width
- [ ] All existing 64 tests still pass; Sidebar tests added (5–8 new)
- [ ] No regressions on login page (no sidebar rendered)
