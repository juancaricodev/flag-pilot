# Design: 5.4b Sidebar + Dashboard Layout

## File Changes

| Action     | Path                                                   | Purpose                                                              |
| ---------- | ------------------------------------------------------ | -------------------------------------------------------------------- |
| **Create** | `src/components/organisms/Sidebar/Sidebar.tsx`         | Client Component — nav links, active state, logout form              |
| **Create** | `src/components/organisms/Sidebar/Sidebar.module.scss` | All sidebar styles                                                   |
| **Create** | `src/components/organisms/Sidebar/types.ts`            | Props type (empty if stateless)                                      |
| **Create** | `src/components/organisms/Sidebar/Sidebar.test.tsx`    | 5–8 unit tests                                                       |
| **Create** | `src/components/organisms/Sidebar/index.ts`            | Barrel export                                                        |
| **Create** | `src/components/organisms/index.ts`                    | Organisms barrel                                                     |
| **Create** | `src/app/(dashboard)/layout.tsx`                       | Server Component — flex layout wrapping Sidebar + children           |
| **Create** | `src/app/(dashboard)/layout.module.scss`               | Layout styles                                                        |
| **Create** | `src/app/(dashboard)/audit/page.tsx`                   | Placeholder Server Component                                         |
| **Create** | `src/app/(dashboard)/metrics/page.tsx`                 | Placeholder Server Component                                         |
| **Move**   | `src/app/flags/` → `src/app/(dashboard)/flags/`        | Move page + module.scss, update none (no import path changes needed) |
| **Remove** | `src/app/flags/`                                       | Old location after move                                              |

## Component Structure

### Sidebar (Client Component)

```
Sidebar (Client Component)
├── <aside>          — 260px, sticky, full height, bg-elevated + border-right
│   ├── <div>        — Brand: "Flag Pilot" text, text-lg, font-semibold
│   ├── <nav>
│   │   ├── <Link> → /flags     — "Flags" (active when pathname starts with /flags)
│   │   ├── <Link> → /audit     — "Audit Log" (active when /audit)
│   │   └── <Link> → /metrics   — "Metrics" (active when /metrics)
│   └── <form action={logout}>  — Bottom-anchored
│       └── <button type="submit"> — "Sign out", ghost variant
```

**Props**: None — self-contained. Reads `usePathname()` from `next/navigation` internally.

**States**:

- **Active nav**: Link whose `pathname.startsWith(href)` gets class `.linkActive` + `aria-current="page"`
- **Logout submitting**: Form submission is native — no loading state needed (Server Action redirects)
- **Edge — root `/`**: Pathname `/` matches nothing → no active link (correct, sidebar never renders at `/` because proxy redirects)

### Dashboard Layout (Server Component)

```
┌─────────────────────────────────────────┐
│ RootLayout (html shell, unchanged)      │
│  ┌──────────┬──────────────────────────┐│
│  │ Sidebar  │  <main>                  ││
│  │ 260px    │  flex: 1 (children)      ││
│  │ sticky   │  overflow-y: auto        ││
│  │ h-screen │  padding: space-8        ││
│  └──────────┴──────────────────────────┘│
└─────────────────────────────────────────┘
```

## Data Flow — Logout

```
User clicks "Sign out"
  → <form action={logout}> submits (native POST)
    → logout() Server Action executes:
      1. cookies().set('access_token', '', { maxAge: 0 })
      2. redirect('/login') throws NEXT_REDIRECT
    → Browser lands on /login (outside dashboard layout → no sidebar)
```

No client state, no API call, no loading spinner. The form action pattern uses Next.js built-in Server Action handling.

## Styling Approach

All styles use existing tokens only — no new CSS custom properties.

**Sidebar `Sidebar.module.scss`**:

| Element        | Token usage                                              | Notes                                                  |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------ |
| `<aside>`      | `--bg-elevated`, `--border`, `--space-6` padding         | Right border separates from content                    |
| Brand text     | `--text-lg`, `--font-sans`, `--text`, `--tracking-tight` |                                                        |
| Nav link       | `--text-sm`, `--text-secondary`, `--radius-md` padding   | `display: flex`, `align-items: center`                 |
| Nav link hover | `--bg-muted`, `--text`                                   |                                                        |
| Active link    | `--accent-light` bg, `--accent` text, `--font-medium`    |                                                        |
| Logout area    | `--border` top separator, `--text-muted` text            | Pushed to bottom via `margin-top: auto` in flex column |

**Dashboard layout `layout.module.scss`**:

```scss
.layout {
  display: flex;
  min-height: 100vh; // full viewport height
}

.main {
  flex: 1;
  padding: var(--space-8);
  overflow-y: auto;
}
```

**Flags page** — remove `max-width` + `margin: 0 auto`; keep padding. Content area handles width via flex.

## Migration — Flags Page

Move `src/app/flags/` → `src/app/(dashboard)/flags/`. The `page.tsx` imports (`@/data/flags`, `@/components/molecules/FlagCard`) are unaffected because they use absolute `@/` paths. The `page.module.scss` needs one edit: remove `max-width` and `margin` centering — the flex parent controls width now.

## Testing Strategy

| Test Suite         | Tests   | Approach                                        |
| ------------------ | ------- | ----------------------------------------------- |
| `Sidebar.test.tsx` | 7 tests | Renders links, active highlighting, logout form |

```typescript
// Sidebar.test.tsx — test structure
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// 1. renders all three nav links with correct hrefs
// 2. highlights Flags when pathname is /flags
// 3. highlights Audit Log when pathname is /audit
// 4. highlights Metrics when pathname is /metrics
// 5. highlights Flags when pathname is /flags/ some-subpage (prefix match)
// 6. renders logout form with action pointing to logout
// 7. renders "Flag Pilot" branding text
```

No E2E tests (post-MVP). Placeholder pages are pure Server Components — no tests needed per project convention.

## Staged Plan

| Stage               | Files                                           | Verified by                    |
| ------------------- | ----------------------------------------------- | ------------------------------ |
| **1. Organism**     | Sidebar + styles + types + test + barrel        | `pnpm --filter dashboard test` |
| **2. Route group**  | `(dashboard)/layout.tsx` + styles, placeholders | Visit `/audit`, `/metrics`     |
| **3. Move flags**   | Move `flags/` into `(dashboard)/`, delete old   | Visit `/flags`, `pnpm test`    |
| **4. Proxy update** | Add `/audit`, `/metrics` to proxy if missing    | Visit unauthenticated          |

## Open Questions

1. **Nav link hrefs**: Are they `/flags`, `/audit`, `/metrics` or becomes `/dashboard/flags`? The route group `(dashboard)` keeps them at `/flags` — confirmed in spec.
2. **Logout button**: Use existing `Button` atom with `variant="ghost"`? Yes — prevents style drift and keeps consistency.
3. **Flags page styles**: Remove `max-width: 1200px; margin: 0 auto` from `page.module.scss` — the `(dashboard)` layout's `padding: var(--space-8)` on `<main>` handles spacing. The grid's max-width should be constrained by the parent flex, not the page itself.
