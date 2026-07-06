# Proposal: 5.6 Toggle Switch

## Intent

Allow operators to enable/disable feature flags inline from the Flags list page without navigating to a detail view.

## Scope

### In Scope

- Server Action `toggleFlag(flagId, enabled)` in `src/actions/flags.ts` — calls `PATCH /api/flags/:id`, passes auth cookie, calls `revalidateTag('flags')` on success, returns `{ success: true }` or `{ error: string }`
- `getFlags()` in `src/data/flags.ts` — add `next: { tags: ['flags'] }` to the fetch call so `revalidateTag('flags')` actually invalidates the cache
- `FlagCard` types (`types.ts`) — add optional `onToggle?: (flagId: string, enabled: boolean) => Promise<void>` prop
- `FlagCard` component (`FlagCard.tsx`) — render a toggle switch in the footer (right side) that calls `onToggle` with the negated `enabled` value; show loading/disabled state while toggle is in flight
- `FlagCard` styles (`FlagCard.module.scss`) — styles for the toggle switch element and its loading state
- `FlagCard` tests (`FlagCard.test.tsx`) — add tests for toggle render, click interaction, loading state, and `onToggle` callback
- `FlagsPage` (`src/app/(dashboard)/flags/page.tsx`) — import `toggleFlag`, pass it as `onToggle` to each `FlagCard`
- Server Action tests (`src/actions/flags.test.ts`) — unit tests for `toggleFlag`: success path, API error, network failure, missing auth cookie
- This proposal file

### Out of Scope

- Toggle atom extraction — the toggle switch lives inside FlagCard for now. If another consumer needs it later, it can be extracted to `src/components/atoms/Toggle/`
- Create/Edit flag form (5.5), audit log (5.7), metrics (5.8)
- Bulk toggle, confirmation dialog, undo snackbar, or optimistic updates
- Changes to the API (`PATCH /api/flags/:id` already exists and works)
- Changes to `@fp/shared` types
- E2E tests (planned post-MVP)

## Motivation

Feature flag management is fundamentally about flipping flags on and off. The flagship page (Flags list) currently requires operators to read flag info but provides no action — you can see a flag is disabled, but you can't enable it. Making toggle available directly from the card:

- **Reduces friction**: No navigation to a detail page, no form submission — one click, instant (as instant as the round-trip allows)
- **Matches mental model**: A flag card showing status should be actionable on that status. Users naturally expect to click it.
- **Low hanging fruit**: The API endpoint already exists, the data model already has `enabled`, and the card already displays the flag — we're connecting the last wire.

## Approach

### 1. Server Action (`src/actions/flags.ts`)

```
'use server';

export async function toggleFlag(flagId: string, enabled: boolean)
  → { success: true } | { error: string }
```

Follow the exact pattern from `auth.ts`:

- `await cookies()` from `next/headers` to read `access_token`
- If no token, return `{ error: 'Not authenticated' }` (don't throw — let the caller decide)
- `fetch(`${API_URL}/api/flags/${flagId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: `access_token=${token}` }, body: JSON.stringify({ enabled }) })`
- On `response.ok`: call `revalidateTag('flags')`, return `{ success: true }`
- On error: parse `response.json()` for `message`, return `{ error: message }` or fallback `{ error: 'Failed to update flag (${status})' }`
- On network error: catch, return `{ error: err.message }`

### 2. Fix `getFlags()` cache tag

Currently `getFlags()` in `src/data/flags.ts` does a plain `fetch(...)` with no cache tags. Add:

```ts
const response = await fetch(`${API_URL}/api/flags`, {
  headers: { Cookie: `access_token=${token}` },
  next: { tags: ['flags'] },
});
```

This is required for `revalidateTag('flags')` to do anything — without it, revalidation is a no-op.

### 3. FlagCard changes

**types.ts** — add `onToggle` to `FlagCardProps`:

```ts
export interface FlagCardProps {
  flag: Flag;
  onToggle?: (flagId: string, enabled: boolean) => Promise<void>;
}
```

It's optional because the card should still render without it (e.g., in loading skeletons or other contexts).

**FlagCard.tsx** — add:

- Local `useState` for `isPending` (loading state while toggle is in flight)
- A toggle switch rendered in the footer, right-aligned (the footer already has `justify-content: space-between`)
- The toggle is a `<button>` with `role="switch"` and `aria-checked={flag.enabled}`, styled as a slider/switch
- `onClick` handler: call `onToggle(flag.id, !flag.enabled)`, set `isPending = true`, await the result, set `isPending = false`, handle errors (could surface via toast or just swallow after setting state — for MVP, we can set a local error state or simply log)
- The toggle is disabled while `isPending` is true

**Toggle visual design (MVP)**:

A CSS-only toggle switch:

- Track: rounded rectangle (~36px wide × 20px tall), gray when off, accent color when on
- Thumb: circle (~16px), white, moves left/right via `translateX` or `margin`
- No text labels on the toggle itself (the Badge already shows status text)
- Use CSS transitions for smooth animation

### 4. Flags page change

```tsx
// src/app/(dashboard)/flags/page.tsx
import { toggleFlag } from '@/actions/flags';

export default async function FlagsPage() {
  const flags = await getFlags();
  return (
    ...
    {flags.map((flag) => (
      <FlagCard key={flag.id} flag={flag} onToggle={toggleFlag} />
    ))}
    ...
  );
}
```

Server Action can be passed as a prop to Client Components — Next.js handles this transparently (the action is serializable by reference).

### 5. Testing

**Server Action tests (`src/actions/flags.test.ts`)**:

- `@jest-environment node` (same as `auth.test.ts`)
- Mock `next/headers` `cookies()` to return a `get` method that returns `{ value: 'test-token' }`
- Mock `next/cache` `revalidateTag` (jest.fn())
- Mock `globalThis.fetch`
- Test cases:
  - Calls PATCH with correct URL, method, headers, body, and auth cookie
  - Returns `{ success: true }` on API success
  - Calls `revalidateTag('flags')` on success
  - Returns error from API message on 4xx/5xx
  - Returns fallback error when API has no message
  - Returns error on network failure
  - Returns error when cookie is missing

**FlagCard tests**:

- Renders toggle button with `role="switch"` and correct `aria-checked`
- Toggle click calls `onToggle(flag.id, !flag.enabled)`
- Button is disabled while loading
- Does NOT render toggle when `onToggle` is not provided

## Risks

| Risk                                                                                             | Likelihood                       | Mitigation                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `revalidateTag('flags')` is a no-op because `getFlags()` doesn't use `next: { tags }`            | **Certain** (currently the case) | Add `next: { tags: ['flags'] }` to the fetch in `getFlags()` — in scope for this change                                                                                |
| Toggle action fails silently — user clicks but nothing visible happens                           | Medium                           | Toggle is disabled during loading (`isPending`). On error, re-enable so user can retry. Future: add toast notification                                                 |
| Auth cookie not sent because `cookies()` in Server Action differs from `cookies()` in data fetch | Low                              | Both use `await cookies()` from `next/headers` — consistent pattern. Test covers the cookie-passing path                                                               |
| Toggle `aria-checked` gets out of sync with server if another user changes the flag              | Low                              | The card re-renders on page refresh / revalidation. No real-time sync needed for MVP                                                                                   |
| Server Action receives stale `flag.enabled` if user clicks rapidly                               | Low                              | `isPending` disables the toggle during flight — prevents double-fire. The action always sends the _intended_ state from the click, not a computed toggled-from-current |
| Accessible toggle switch is harder to style than a button                                        | Low                              | Using `<button role="switch" aria-checked>`, which is semantically correct and accessible by default. Follow ARIA authoring practices for switch pattern               |
