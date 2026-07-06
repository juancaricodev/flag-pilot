---
name: flag-pilot-dashboard
description: >
  Dashboard conventions for Flag Pilot: Next.js 16 + React 19 + Atomic Design + CSS Modules.
  Trigger: When editing files in apps/dashboard/, creating components, or writing Server Actions.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: '1.0'
---

## When to Use

Apply this skill when:

- Creating or modifying components in `apps/dashboard/src/components/`
- Writing Server Actions in `apps/dashboard/src/actions/`
- Adding data fetchers in `apps/dashboard/src/data/`
- Creating or editing pages in `apps/dashboard/src/app/`
- Writing tests for any of the above

---

## Critical Patterns

### Pattern 1: Atomic Design Structure

Components live in `src/components/{layer}/`:

```
src/components/
├── atoms/        ← Button, Badge, StatusDot, Input (single responsibility)
├── molecules/    ← FlagCard, LoginForm (composed of atoms + logic)
└── organisms/    ← FlagList, Sidebar (composed of molecules, handles data)
```

- Atoms: NO business logic, NO data fetching, NO side effects. Pure presentation.
- Molecules: MAY have business logic, MAY be `'use client'`, NO direct data fetching.
- Organisms: MAY orchestrate data fetching, compose molecules/layout.

### Pattern 2: File Structure per Component

Each component follows this structure:

```
ComponentName/
├── ComponentName.tsx         ← Component
├── ComponentName.module.scss ← Styles (CSS Modules)
├── types.ts                  ← Props/state types (co-located)
├── index.ts                  ← Re-export (barrel)
└── ComponentName.test.tsx    ← Tests (if testable)
```

**Exception**: Simple atoms MAY be a single file if types are inlined and trivial.

### Pattern 3: Server vs Client Components

- **Server Components by default** — every new component starts as Server Component
- Add `'use client'` ONLY when you need: hooks (useState, useEffect, useRouter), event handlers (onClick, onSubmit), browser APIs, or context providers
- **DO NOT** add `'use client'` for: data fetching (use Server Actions instead), string formatting, date rendering, static content
- Data fetching Server Actions in `src/actions/` are called from Server Components via `revalidateTag`/`revalidatePath`

### Pattern 4: CSS Modules + SCSS

- Every component gets a co-located `.module.scss` file
- Use `@use 'sass:map'` for token access (NEVER use deprecated global `map-get`, `map-has-key`)
- Import tokens: `@use '@/styles/tokens' as *;` or `@use '@/styles/tokens';`
- Class names: `camelCase` in SCSS, accessed via `styles.camelCase` in TSX
- No Tailwind, no CSS-in-JS, no inline styles (except dynamic values)

Token file: `src/styles/_tokens.scss` — colors, spacing, typography, breakpoints
Mixins file: `src/styles/_mixins.scss` — responsive, layout, interaction mixins

### Pattern 5: Server Actions (Data Mutations)

All mutations go through Server Actions in `src/actions/`:

```typescript
// src/actions/flags.ts
'use server';

export async function createFlag(data: CreateFlagInput): Promise<ActionResponse> {
  // 1. Validate input
  // 2. Call API with cookie from cookies()
  // 3. revalidateTag('flags') on success
  // 4. Return { success: true } or { error: string }
}
```

- NEVER fetch from client components — always use Server Actions
- Pass cookie via `cookies()` from `next/headers` — never from client
- Use `revalidateTag()` or `revalidatePath()` after mutations
- Return a `ActionResponse` type: `{ success: true, data?: T } | { error: string }`

### Pattern 6: Data Fetching

Data fetchers in `src/data/` are thin functions:

```typescript
// src/data/flags.ts
export async function getFlags(): Promise<Flag[]> {
  const res = await fetch(`${API_URL}/api/flags`, {
    headers: { cookie: (await cookies()).toString() },
    next: { tags: ['flags'] },
  });
  if (!res.ok) throw new ApiError('Failed to fetch flags', res.status);
  return res.json();
}
```

- Server Components call data functions directly (no useEffect)
- Use `next: { tags: [...] }` for cache invalidation
- `revalidateTag()` in Server Actions to refresh after mutations
- Organize by domain: `flags.ts`, `audit.ts`, `metrics.ts`

### Pattern 7: Component Testing

- **DO test**: atoms, molecules, data fetchers, utils, Server Actions
- **DO NOT test**: page.tsx files (thin orchestration)
- Use `@testing-library/react` + Jest for component tests
- Use `@testing-library/user-event` for interaction tests
- Test structure follows component file structure (co-located)

```typescript
// ComponentName.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('renders with required props', () => {
    render(<ComponentName label="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### Pattern 8: Proxy (Next.js 16 Auth)

- Auth is handled by `src/proxy.ts` (Next.js 16 convention, NOT `middleware.ts`)
- Proxy reads httpOnly JWT cookie, redirects to `/login` if missing
- Route matcher: `export const config = { matcher: ['/((?!login|_next|api|favicon.ico).*)'] }`
- Proxy runs on `nodejs` runtime (NOT `edge`)

### Pattern 9: Naming Conventions

| What           | Convention                 | Example                                |
| -------------- | -------------------------- | -------------------------------------- |
| Components     | PascalCase + domain prefix | `FlagCard`, `StatusDot`                |
| Server Actions | camelCase, verb-first      | `createFlag`, `toggleFlag`             |
| Data fetchers  | camelCase, noun-first      | `getFlags`, `getAuditLog`              |
| SCSS files     | ComponentName.module.scss  | `FlagCard.module.scss`                 |
| CSS classes    | camelCase                  | `styles.rolloutBar`, `styles.cardBody` |
| Files          | Same as component/function | `FlagCard.tsx`                         |
| Test files     | ComponentName.test.tsx     | `FlagCard.test.tsx`                    |
| Types          | PascalCase per file        | `FlagCardProps` in `types.ts`          |

---

## Code Examples

### Atom template

```typescript
// src/components/atoms/Button/Button.tsx
import styles from './Button.module.scss';

interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  onClick?: () => void;
  disabled?: boolean;
}

export function Button({ label, variant = 'primary', onClick, disabled }: ButtonProps) {
  return (
    <button
      className={`${styles.button} ${styles[variant]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
```

### Server Action template

```typescript
// src/actions/flags.ts
'use server';

import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';

const API_URL = process.env.API_URL!;

export async function createFlag(data: { name: string; description?: string }) {
  const res = await fetch(`${API_URL}/api/flags`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: (await cookies()).toString(),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    return { error: err.message || 'Failed to create flag' };
  }

  revalidateTag('flags');
  return { success: true, data: await res.json() };
}
```

---

## Commands

```bash
# Run dashboard tests
pnpm --filter dashboard test

# Run tests in watch mode
pnpm --filter dashboard test:watch

# Type check
pnpm --filter dashboard typecheck

# Lint
pnpm --filter dashboard lint
```

---

## Resources

- **Design tokens**: See `apps/dashboard/src/styles/_tokens.scss`
- **Mixins**: See `apps/dashboard/src/styles/_mixins.scss`
- **Docs**: See `docs/design.md` for full architecture decisions
