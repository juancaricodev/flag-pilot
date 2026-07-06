# Exploration: 5.4b Sidebar + Layout

> **Change**: Navigation sidebar organism + dashboard layout update
> **Date**: 2026-07-06
> **Status**: Complete

---

## 1. Current Route Structure

### 1.1 App Router Layout

| Path       | File                             | Description                                        |
| ---------- | -------------------------------- | -------------------------------------------------- |
| `/`        | `proxy.ts` (redirect)            | Redirects to `/flags` if authed, `/login` if not   |
| `/login`   | `src/app/login/page.tsx`         | Login form, uses RootLayout directly               |
| `/flags`   | `src/app/flags/page.tsx`         | Flag list, uses RootLayout directly                |
| `/flags`   | `src/app/flags/page.module.scss` | Self-contained styles (max-width 1200px, centered) |
| `/audit`   | **DOES NOT EXIST**               | Referenced in proxy but no route directory         |
| `/metrics` | **DOES NOT EXIST**               | Referenced in proxy but no route directory         |

### 1.2 RootLayout (`src/app/layout.tsx`)

```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- **Bare minimum** — no sidebar, no auth-awareness, just fonts + global styles
- Login and flags pages BOTH use this same layout (no differentiation)

### 1.3 Proxy (`src/proxy.ts`)

```ts
const protectedRoutes = ['/flags', '/audit', '/metrics'];
```

- `matcher` excludes `_next/static`, `_next/image`, `favicon.ico`
- Home `/` redirects based on auth status
- Login `/login` redirects to `/flags` if already authenticated

### 1.4 What Needs to Change

- **RootLayout needs to stay as thin HTML shell** (it wraps everything)
- **Need an `(auth)` route group** for authenticated pages with sidebar
- **Login stays outside `(auth)` group** — no sidebar
- **`/audit` and `/metrics` route directories don't exist yet** — sidebar will link to 404s if not created
- **Flags page currently has self-contained header** (`<h1>Feature Flags</h1>`) — may need review

---

## 2. Existing Components

### 2.1 Atoms (`src/components/atoms/`)

| Component | Files                                                                         | Tests   | Notes                                           |
| --------- | ----------------------------------------------------------------------------- | ------- | ----------------------------------------------- |
| `Button/` | `Button.tsx`, `types.ts`, `Button.module.scss`, `Button.test.tsx`, `index.ts` | 8 tests | `forwardRef`, variants: primary/secondary/ghost |
| `Badge/`  | `Badge.tsx`, `types.ts`, `Badge.module.scss`, `Badge.test.tsx`, `index.ts`    | 5 tests | Status: enabled/disabled/partial                |
| `Input/`  | `Input.tsx`, `types.ts`, `Input.module.scss`, `Input.test.tsx`, `index.ts`    | 7 tests | `forwardRef`, label, error state                |

- Barrel: `src/components/atoms/index.ts` re-exports all three
- All follow atomic design pattern with co-located types, styles, tests

### 2.2 Molecules (`src/components/molecules/`)

| Component    | Files                                                                   | Tests    | Notes                                             |
| ------------ | ----------------------------------------------------------------------- | -------- | ------------------------------------------------- |
| `FlagCard/`  | `FlagCard.tsx`, `types.ts`, `FlagCard.module.scss`, `FlagCard.test.tsx` | 11 tests | `'use client'`, missing `index.ts` barrel         |
| `LoginForm/` | `LoginForm.tsx`, `LoginForm.module.scss`, `LoginForm.test.tsx`          | 9 tests  | `'use client'`, missing `index.ts` and `types.ts` |

- **No barrel export** for molecules (no `molecules/index.ts`)
- **No `organisms/` directory exists at all** — needs creation

### 2.3 What Needs to Change

- **Create `src/components/organisms/` directory**
- **Create `src/components/organisms/Sidebar/`** with full structure:
  - `Sidebar.tsx`
  - `Sidebar.module.scss`
  - `types.ts`
  - `Sidebar.test.tsx`
  - `index.ts`
- **Create `src/components/organisms/index.ts`** barrel

---

## 3. Design Tokens

### 3.1 Available Tokens

| Category      | Available                                                     | Suitable for Sidebar?             |
| ------------- | ------------------------------------------------------------- | --------------------------------- |
| Colors        | Slate neutrals (#ffffff → #171717), Sky accent (#2563eb)      | ✅                                |
| Dark mode     | `prefers-color-scheme: dark` overrides                        | ✅                                |
| Spacing       | `--space-1` (0.25rem) through `--space-20` (5rem)             | ✅                                |
| z-index       | `--z-dropdown: 100`, `--z-sticky: 200`, `--z-overlay: 300`    | ✅ `--z-sticky` for fixed sidebar |
| Shadows       | `--shadow-sm` through `--shadow-xl`                           | ✅                                |
| Transitions   | `--transition-fast`, `--transition-base`, `--transition-slow` | ✅                                |
| Border radius | `--radius-md` through `--radius-2xl`                          | ✅                                |
| Font families | `--font-sans` (Geist), `--font-mono` (Geist Mono)             | ✅                                |

### 3.2 Available Mixins

| Mixin                           | Purpose                                              |
| ------------------------------- | ---------------------------------------------------- |
| `respond-to($bp)`               | Mobile-first media query                             |
| `respond-down($bp)`             | Desktop-first media query                            |
| `focus-ring($color)`            | Keyboard focus indicator                             |
| `card`                          | Card container (bg-elevated, border, radius, shadow) |
| `flex-center`                   | Flexbox centering                                    |
| `transition($props, $duration)` | Transition preset                                    |
| `text-truncate`                 | Ellipsis overflow                                    |
| `visually-hidden`               | Accessible hidden content                            |

### 3.3 What Might Need to Change

- **No sidebar-specific tokens** but existing tokens suffice
- **Sidebar width needs definition** — suggest `--sidebar-width` custom property (e.g., 16rem / 256px)
- **`--z-sticky: 200`** is appropriate for sidebar z-index
- **`--border` color** for sidebar separator
- **`--bg-elevated` or `--bg-subtle`** for sidebar background

---

## 4. Auth System

### 4.1 Login Server Action (`src/actions/auth.ts`)

```
login(_prevState, formData) → { success: true } | { success: false, error: string }
  - POST /api/auth/login
  - Sets httpOnly cookie 'access_token' (7 days)
  - Returns success = true on valid credentials

logout() → void (never returns — calls redirect())
  - Clears 'access_token' cookie (maxAge: 0)
  - Calls redirect('/login') — THROWS a special redirect value
```

### 4.2 Key `logout()` Behavior

```ts
export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('access_token', '', { maxAge: 0, path: '/' });
  redirect('/login'); // ← THROWS — never returns
}
```

- `redirect()` from `next/navigation` throws a `REDIRECT_ERROR` — this is by design
- Currently called directly in Server Action — works fine
- For the sidebar, `logout()` will be used in a `<form action={logout}>` pattern (no client JS needed)

### 4.3 What Needs to Change

- **Sidebar needs logout integration** — use `<form action={logout}>` pattern (works as Server Component)
- **No changes to `auth.ts` itself** — current implementation is correct

---

## 5. Login Page

### 5.1 Current State

```tsx
// src/app/login/page.tsx
export default function LoginPage() {
  return <LoginForm />; // Uses RootLayout
}
```

- **Uses RootLayout directly** — no special layout
- **Correctly rendered without sidebar** — login should not show navigation
- LoginForm molecule handles all form state with `useActionState`

### 5.2 What Needs to Change

- **Stays as-is** — login remains outside the `(auth)` route group
- RootLayout will stay clean; only `(auth)` pages get the sidebar

---

## 6. Flags Page

### 6.1 Current State

```tsx
// src/app/flags/page.tsx
export default async function FlagsPage() {
  const flags = await getFlags();
  return (
    <div className={styles.page}>           // max-width: 1200px; margin: 0 auto
      <header>                               // Self-contained page header
        <h1>Feature Flags</h1>
        <p>{flags.length} flags configured</p>
      </header>
      <div className={styles.grid}>
        {flags.map(flag => <FlagCard ... />)}
      </div>
    </div>
  );
}
```

- **Self-contained header**: Title + flag count
- **`max-width: 1200px; margin: 0 auto`**: Centered, full-width layout
- **No awareness of sidebar** — will need width adjustment when sidebar is present

### 6.2 What Needs to Change

- **Move `src/app/flags/` → `src/app/(auth)/flags/`** (route group preserves `/flags` URL)
- **Adjust `page.module.scss`** — content area must account for sidebar width
- **Header may stay as-is** (it's page-specific content, not layout)
- **Consider** whether page header should remain in page or move to auth layout

---

## 7. Test Infrastructure

### 7.1 Current Setup

| Config        | Value                                                    |
| ------------- | -------------------------------------------------------- |
| Framework     | Jest 30                                                  |
| React testing | `@testing-library/react` 16.3.2                          |
| User events   | `@testing-library/user-event` 14.6.1                     |
| DOM matchers  | `@testing-library/jest-dom` 6.9.1                        |
| Environment   | jsdom (default), `@jest-environment node` (actions/data) |
| Path alias    | `^@/(.*)$` → `<rootDir>/src/$1`                          |
| Setup file    | `jest.setup.ts`: `import '@testing-library/jest-dom'`    |

### 7.2 Current Test Coverage

| File                                     | Tests    | Suite                 |
| ---------------------------------------- | -------- | --------------------- |
| `atoms/Button/Button.test.tsx`           | 8 ✓      | Button                |
| `atoms/Badge/Badge.test.tsx`             | 5 ✓      | Badge                 |
| `atoms/Input/Input.test.tsx`             | 7 ✓      | Input                 |
| `molecules/FlagCard/FlagCard.test.tsx`   | 11 ✓     | FlagCard              |
| `molecules/LoginForm/LoginForm.test.tsx` | 9 ✓      | LoginForm             |
| `actions/auth.test.ts`                   | 14 ✓     | Auth (login + logout) |
| `data/flags.test.ts`                     | 5 ✓      | getFlags              |
| `utils/formatDate.test.ts`               | 5 ✓      | formatDate            |
| **Total**                                | **64 ✓** | **8 suites**          |

### 7.3 Testing Patterns Observed

```tsx
// Pattern 1: Component test with co-location
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from './ComponentName';

// Pattern 2: Server Action / Data test with node env
/**
 * @jest-environment node
 */
import { cookies } from 'next/headers';
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: mockFn, set: mockFn })),
}));
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));
```

### 7.4 What Needs to Change

- **Sidebar tests follow same patterns** — co-located `Sidebar.test.tsx`
- **Sidebar is a Server Component** — tests use jsdom environment (no `@jest-environment node` needed unless testing the logout action integration)
- **If Sidebar uses `cookies()` or `redirect()` directly**, tests need node environment and mocks
- **If Sidebar receives props from layout** (e.g., `currentPath`), it becomes testable with plain rendering

---

## 8. Key Architecture Decisions for the Implementation

### 8.1 Route Group Strategy

```
src/app/
├── layout.tsx               ← Root HTML shell (NO changes needed)
├── login/
│   └── page.tsx             ← No sidebar (stays)
├── (auth)/
│   ├── layout.tsx           ← NEW: wraps with Sidebar
│   ├── flags/
│   │   ├── page.tsx         ← MOVED from /flags
│   │   └── page.module.scss ← MOVED, may need style adjustments
│   ├── audit/
│   │   └── page.tsx         ← NEW: placeholder or real page
│   └── metrics/
│       └── page.tsx         ← NEW: placeholder or real page
└── favicon.ico
```

**Why route groups?** URL paths stay the same (`/flags`, not `/(auth)/flags`). Login stays outside the group and gets no sidebar.

### 8.2 Sidebar Component Design

**Type**: Server Component (can be, but active link detection requires consideration)

**Options for active link highlighting**:

| Approach                                  | Pros                   | Cons                           |
| ----------------------------------------- | ---------------------- | ------------------------------ |
| **Client Component** with `usePathname()` | Exact active detection | Adds JS bundle, `'use client'` |
| **Server Component** with path prop       | No client JS, testable | Layout must pass path down     |
| **CSS-only** with `[aria-current="page"]` | Simple, no JS          | Must set attribute server-side |

**Recommendation**: Server Component receiving `currentPath` as prop from `(auth)/layout.tsx`. The layout can read `headers()` or use the URL... but wait, Server Components can't easily get the current path. Actually in Next.js App Router, `params` and `searchParams` are available in page components but NOT in layouts.

**Revised recommendation**: Use `'use client'` for active link detection via `usePathname()`, or use a simple approach:

- Accept that highlighting requires client JS, or
- Use `<form action={logout}>` for logout and `<a>` links as Server Component
- Make the Sidebar a Client Component with `usePathname()` from `next/navigation`

### 8.3 Logout Implementation

Using Server Action form pattern (works in Server Components too):

```tsx
<form action={logout}>
  <button type="submit">Sign out</button>
</form>
```

- No JavaScript required
- The `redirect()` inside `logout()` is handled by Next.js at the framework level
- Works in both Server and Client Components

### 8.4 Sidebar Width

- Fixed width sidebar: recommend `--sidebar-width: 16rem` (256px)
- Content area takes `calc(100vw - var(--sidebar-width))`
- Responsive: collapse on mobile (below `md` breakpoint)

### 8.5 Navigation Links

| Label       | Path              | Icon                  |
| ----------- | ----------------- | --------------------- |
| Flags       | `/flags`          | (future: flag icon)   |
| Audit Log   | `/audit`          | (future: clock icon)  |
| Metrics     | `/metrics`        | (future: chart icon)  |
| _separator_ |                   |                       |
| Sign out    | `action={logout}` | (future: logout icon) |

---

## 9. Files That Will Be Affected

### New Files

| #   | File                                                   | Description              |
| --- | ------------------------------------------------------ | ------------------------ |
| 1   | `src/components/organisms/Sidebar/Sidebar.tsx`         | Sidebar component        |
| 2   | `src/components/organisms/Sidebar/Sidebar.module.scss` | Sidebar styles           |
| 3   | `src/components/organisms/Sidebar/types.ts`            | Sidebar props/types      |
| 4   | `src/components/organisms/Sidebar/Sidebar.test.tsx`    | Sidebar tests            |
| 5   | `src/components/organisms/Sidebar/index.ts`            | Sidebar barrel           |
| 6   | `src/components/organisms/index.ts`                    | Organisms barrel         |
| 7   | `src/app/(auth)/layout.tsx`                            | Auth layout with Sidebar |
| 8   | `src/app/(auth)/audit/page.tsx`                        | Placeholder audit page   |
| 9   | `src/app/(auth)/metrics/page.tsx`                      | Placeholder metrics page |

### Modified Files

| #   | File                             | Change                                      |
| --- | -------------------------------- | ------------------------------------------- |
| 10  | `src/app/flags/page.tsx`         | Move to `src/app/(auth)/flags/page.tsx`     |
| 11  | `src/app/flags/page.module.scss` | Move to `(auth)/flags/`, adjust for sidebar |
| 12  | `src/app/layout.tsx`             | Stays as HTML shell (minimal/no changes)    |

### Unchanged Files

| File                         | Reason                                        |
| ---------------------------- | --------------------------------------------- |
| `src/actions/auth.ts`        | Logout works as-is with `form action` pattern |
| `src/proxy.ts`               | Route patterns unchanged by route groups      |
| `src/components/atoms/*`     | No atom changes needed                        |
| `src/components/molecules/*` | No molecule changes needed                    |
| `src/styles/*`               | Tokens/mixins sufficient for sidebar styling  |

---

## 10. Risks and Gotchas

### 10.1 `redirect()` Throws in Server Actions

```ts
export async function logout() {
  cookies().set('access_token', '', { maxAge: 0 });
  redirect('/login'); // ← throws REDIRECT_ERROR
}
```

This is **by design** in Next.js. The `<form action={logout}>` pattern handles this correctly — the framework catches the redirect and responds accordingly. **No special handling needed** in the Sidebar, but tests need to account for the throw.

### 10.2 Active Link Detection in Server Components

Server Components cannot access `usePathname()`. If active link highlighting is desired:

- Option A: Make sidebar a Client Component (adds `'use client'`, minimal JS)
- Option B: Skip active highlighting for v1 (all links always same style)
- Option C: Use `headers()` to inspect referer (fragile)

**Recommendation**: Client Component with `usePathname()` — it's a small, predictable component.

### 10.3 `/audit` and `/metrics` Don't Exist

The proxy protects them, and the sidebar will link to them, but no route directories exist. Need at minimum a placeholder page or redirect to flags. This could be:

- Simple placeholder: `<h1>Audit Log</h1><p>Coming soon</p>`
- Or mark them with `aria-disabled` in the sidebar (less ideal)

### 10.4 Sidebar Width vs Responsiveness

Desktop-first or mobile-first? The mixins use mobile-first (`respond-to(md)` for md and up). **Recommendation**: Sidebar is fixed overlay on mobile (via hamburger toggle) and fixed side panel on desktop. But an MVP might skip the mobile toggle and just have a narrow sidebar that collapses to icons.

### 10.5 Page Content Area

Current flags page uses `max-width: 1200px; margin: 0 auto`. With sidebar:

- Content area should use `margin-left: var(--sidebar-width)` or flex layout in auth layout
- The `max-width` approach might conflict — need to adjust

### 10.6 Test Count Baseline

**Current: 60 tests, 8 suites, all passing.** Sidebar tests should add ~5-10 tests:

- Renders navigation links
- Highlights active link (if implemented)
- Logout button renders
- Links have correct hrefs
- Sidebar renders in layout context

---

## 11. Prior Art

The previous change `5.4a-atoms` (archived at `openspec/changes/archive/2026-07-05-5.4a-atoms/`) established:

- Atom component patterns and structure
- The `Flag` type with `status` field
- Complete test patterns for Server Actions and data functions
- This change should follow the same architecture and patterns

---

## Appendix: Quick Reference

```bash
# Test command
pnpm --filter dashboard test

# Current test count
60 tests, 8 suites, all passing

# Component creation command (example)
mkdir -p src/components/organisms/Sidebar/

# Key import paths
@/components/organisms/Sidebar/Sidebar
@/actions/auth
@/styles/tokens
@/styles/mixins
```
