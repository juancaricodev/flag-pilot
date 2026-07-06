# Design: 5.6 Toggle Switch

## Technical Approach

Server Action (`toggleFlag`) → `PATCH /api/flags/:id` → `revalidateTag('flags')` → card re-renders. All inside FlagCard with local `isPending` state. No client-side cache, no optimistic updates — just server authority with cache tag invalidation.

## Architecture Decisions

### Decision: Server Action location

| Option                                         | Tradeoff                                            | Decision        |
| ---------------------------------------------- | --------------------------------------------------- | --------------- |
| `src/actions/flags.ts`                         | Co-located with data layer, follows auth.ts pattern | ✅ **Selected** |
| `src/components/molecules/FlagCard/actions.ts` | Scoped to card but breaks import expectations       | ❌ Rejected     |

**Rationale**: All Server Actions live in `src/actions/`. Separating `toggleFlag` from potential future flag actions into its own file (`flags.ts`), parallel to `auth.ts`.

### Decision: Toggle state management

| Option                     | Tradeoff                                                   | Decision        |
| -------------------------- | ---------------------------------------------------------- | --------------- |
| `useState` for `isPending` | Simple, local, no deps                                     | ✅ **Selected** |
| `useTransition`            | Built-in pending but more ceremony for non-form actions    | ❌ Rejected     |
| `useActionState`           | Requires form + reducer pattern, overkill for single click | ❌ Rejected     |

**Rationale**: Single boolean state, no form, no reducer. `useState` is the simplest correct answer.

### Decision: Confirmation UX

| Option             | Tradeoff                                     | Decision                  |
| ------------------ | -------------------------------------------- | ------------------------- |
| `window.confirm()` | Native, works immediately, no dependencies   | ✅ **Selected (MVP)**     |
| Custom modal       | Better UX but requires new component + state | ❌ Deferred (spec req #3) |

**Rationale**: Spec explicitly mandates `window.confirm()` for MVP. Custom modal is tracked separately per NFR #2.

### Decision: Cache tags granularity

| Option                     | Tradeoff                                             | Decision        |
| -------------------------- | ---------------------------------------------------- | --------------- |
| Single tag `'flags'`       | Invalidates entire list on any toggle                | ✅ **Selected** |
| Per-flag tag `'flag-<id>'` | More granular but unnecessary for current page count | ❌ Rejected     |

**Rationale**: The flags page renders the full list. When one flag toggles, the whole list re-renders anyway. Per-flag tags add complexity without benefit.

## Data Flow

```
User clicks toggle
  ↓
window.confirm("...")
  ↓ (confirmed)
FlagCard: set isPending(true), disable button
  ↓
onToggle(flag.id, !flag.enabled)
  ↓
toggleFlag (Server Action, runs on server)
  ├─ cookies() → read access_token
  ├─ fetch(PATCH /api/flags/:id, { Cookie, body: { enabled } })
  │    ├─ 200 → revalidateTag('flags')
  │    └─ 4xx/5xx → return { error: message }
  └─ network error → return { error: err.message }
  ↓
FlagCard: set isPending(false)
  ↓ (on success)
  getFlags() refetches via cache invalidation
  ↓
React re-renders card with new flag.enabled
```

## File Changes

| File                                                     | Action | Description                                         |
| -------------------------------------------------------- | ------ | --------------------------------------------------- |
| `src/actions/flags.ts`                                   | Create | `toggleFlag(flagId, enabled)` Server Action         |
| `src/actions/flags.test.ts`                              | Create | Unit tests for toggleFlag                           |
| `src/data/flags.ts`                                      | Modify | Add `next: { tags: ['flags'] }` to fetch call       |
| `src/data/flags.test.ts`                                 | Modify | Add test verifying cache tag is set                 |
| `src/components/molecules/FlagCard/types.ts`             | Modify | Add optional `onToggle` prop                        |
| `src/components/molecules/FlagCard/FlagCard.tsx`         | Modify | Add toggle switch, isPending state, click handler   |
| `src/components/molecules/FlagCard/FlagCard.module.scss` | Modify | Add toggle switch CSS (track, thumb, states)        |
| `src/components/molecules/FlagCard/FlagCard.test.tsx`    | Modify | Add tests for toggle render, interaction, loading   |
| `src/app/(dashboard)/flags/page.tsx`                     | Modify | Import `toggleFlag`, pass as `onToggle` to FlagCard |

## Interfaces / Contracts

```ts
// src/actions/flags.ts
export async function toggleFlag(
  flagId: string,
  enabled: boolean,
): Promise<{ success: true } | { error: string }>;

// src/components/molecules/FlagCard/types.ts — updated
export interface FlagCardProps {
  flag: Flag;
  onToggle?: (flagId: string, enabled: boolean) => Promise<void>;
}
```

The Server Action is passed by reference from a Server Component (page.tsx) to a Client Component (FlagCard). Next.js serializes the action reference transparently — the client receives a `$action` reference, not the function body.

## CSS Architecture

Toggle styles live in `FlagCard.module.scss` — not extracted to an atom. CSS-only switch:

```scss
// Inside .footer, right-aligned (footer already has justify-content: space-between)
.toggle {
  @include focus-ring;
  position: relative;
  width: 36px; // track width
  height: 20px; // track height
  border-radius: var(--radius-full);
  background: var(--text-muted); // off state
  border: none;
  cursor: pointer;
  transition: background var(--transition-fast);

  &[aria-checked='true'] {
    background: var(--accent); // on state
  }

  // Thumb via pseudo-element
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px; // thumb diameter
    height: 16px;
    border-radius: 50%;
    background: white;
    transition: transform var(--transition-fast);
  }

  &[aria-checked='true']::after {
    transform: translateX(16px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
```

Uses existing design tokens (`--radius-full`, `--accent`, `--text-muted`, `--transition-fast`) and `@include focus-ring` from `_mixins.scss`.

## Testing Strategy

| Layer         | What to Test                                                                                                | Approach                                                                              |
| ------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Server Action | Success path, API error (with/without message), network failure, missing auth cookie, calls `revalidateTag` | Unit tests in `src/actions/flags.test.ts`, mock `cookies()`, `fetch`, `revalidateTag` |
| Data layer    | `getFlags()` includes `next: { tags: ['flags'] }`                                                           | Add one test case to existing `src/data/flags.test.ts`                                |
| FlagCard      | Toggle render with/without `onToggle`, `aria-checked` sync, click calls callback, disabled while pending    | Unit tests in `FlagCard.test.tsx`, mock `onToggle`, use `jest.fn()`                   |

Server Action tests follow the exact pattern from `auth.test.ts`: `@jest-environment node`, mock `next/headers`, mock `globalThis.fetch`, use helper functions (`mockFetchSuccess`, `mockFetchError`, `mockFetchNetworkError`).

## Error Handling

| Scenario                                       | Behavior                                                                                |
| ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| API returns error (4xx/5xx) with `{ message }` | `toggleFlag` returns `{ error: message }`, button re-enables for retry                  |
| API returns error without message              | `toggleFlag` returns `{ error: 'Failed to update flag ({status})' }`, button re-enables |
| Network failure                                | `toggleFlag` returns `{ error: err.message }`, button re-enables                        |
| No auth cookie                                 | `toggleFlag` returns `{ error: 'Not authenticated' }`, button re-enables                |
| User cancels confirm                           | No action taken — `onToggle` is never called, no state change                           |

No toast or error UI in FlagCard for MVP — the button just re-enables so the user can retry. Error surfacing (toast) is tracked separately.

## Open Questions

None — all decisions are covered by the spec.
