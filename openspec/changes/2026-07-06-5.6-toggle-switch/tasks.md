# Tasks: 5.6 Toggle Switch

## Stage 1: Data Layer + Server Action

Foundation layer — cache tag + Server Action, no UI changes. All new code is testable in isolation. Existing tests continue to pass.

- [x] T-001: **Add cache tag to `getFlags()`** — modify `src/data/flags.ts` to include `next: { tags: ['flags'] }` in the fetch call. This enables `revalidateTag('flags')` to invalidate the flags list cache.
      _File: `apps/dashboard/src/data/flags.ts`_
- [x] T-002: **Add cache tag assertion test** — modify `src/data/flags.test.ts` to add one test case verifying that `getFlags()` sends `next: { tags: ['flags'] }` in the fetch options.
      _File: `apps/dashboard/src/data/flags.test.ts`_
- [x] T-003: **Create `toggleFlag` Server Action** — create `src/actions/flags.ts` with `export async function toggleFlag(flagId: string, enabled: boolean): Promise<{ success: true } | { error: string }>`. Follow the pattern from `auth.ts`: read `access_token` via `cookies()`, `PATCH /api/flags/:id` with auth cookie and JSON body, call `revalidateTag('flags')` on success, return structured error on failure. No throw — always return objects.
      _File: `apps/dashboard/src/actions/flags.ts`_
- [x] T-004: **Create `toggleFlag` tests** — create `src/actions/flags.test.ts` with `@jest-environment node`. Mock `next/headers` (cookies `get`), `next/cache` (`revalidateTag`), and `globalThis.fetch`. Test scenarios:
  - Calls `PATCH` with correct URL, method, headers (auth cookie), and body (`{ enabled }`)
  - Returns `{ success: true }` on API success
  - Calls `revalidateTag('flags')` on success
  - Returns error from API message on 4xx/5xx
  - Returns fallback error when API response has no message
  - Returns error on network failure
  - Returns `{ error: 'Not authenticated' }` when cookie is missing
    _File: `apps/dashboard/src/actions/flags.test.ts`_

## Stage 2: FlagCard Toggle

UI layer — toggle switch rendering, interaction, and wiring. All FlagCard tests (existing + new) must pass.

- [ ] T-005: **Add `onToggle` to FlagCardProps** — add optional `onToggle?: (flagId: string, enabled: boolean) => Promise<void>` to `FlagCardProps` in `types.ts`. Optional so the card renders without it (skeleton, other contexts).
      _File: `apps/dashboard/src/components/molecules/FlagCard/types.ts`_
- [ ] T-006: **Add toggle switch CSS** — append toggle styles to `FlagCard.module.scss`. CSS-only switch: `<button>` styled as track (36×20px, `border-radius: var(--radius-full)`) with thumb via `::after` pseudo-element (16×16px circle, white). Off state: `background: var(--text-muted)`. On state (`[aria-checked="true"]`): `background: var(--accent)` with `translateX(16px)` on thumb. Disabled state: `opacity: 0.5; cursor: not-allowed`. Include `@include focus-ring` from mixins.
      _File: `apps/dashboard/src/components/molecules/FlagCard/FlagCard.module.scss`_
- [ ] T-007: **Add toggle switch to FlagCard** — modify `FlagCard.tsx`: add `useState(false)` for `isPending`, destructure `onToggle` from props. In the `.footer`, right-align a `<button type="button" role="switch" aria-checked={flag.enabled} disabled={isPending}>` that:
  1. On click: shows `window.confirm("Are you sure you want to enable/disable \"{flag.name}\"?")`
  2. If cancelled: does nothing
  3. If confirmed: calls `onToggle(flag.id, !flag.enabled)`, manages `isPending` (true while in flight, false on settle), catches errors silently (button re-enables for retry)
     _File: `apps/dashboard/src/components/molecules/FlagCard/FlagCard.tsx`_
- [ ] T-008: **Add toggle tests to FlagCard.test.tsx** — add test cases:
  - Renders `<button role="switch">` with `aria-checked="true"` when `onToggle` provided and `flag.enabled` is true
  - Renders `<button role="switch">` with `aria-checked="false"` when `onToggle` provided and `flag.enabled` is false
  - Does NOT render a toggle button when `onToggle` is not provided (existing tests still pass)
  - Click calls `onToggle(flag.id, !flag.enabled)` after window.confirm returns true
  - Button has `disabled` attribute while `isPending` is true
  - Button re-enables after `onToggle` settles
    _File: `apps/dashboard/src/components/molecules/FlagCard/FlagCard.test.tsx`_
- [ ] T-009: **Wire `toggleFlag` in FlagsPage** — modify `src/app/(dashboard)/flags/page.tsx`: import `toggleFlag` from `@/actions/flags`, pass `onToggle={toggleFlag}` to each `<FlagCard>`. The Server Action is passed by reference — Next.js serializes it transparently to a `$action` reference on the client.
      _File: `apps/dashboard/src/app/(dashboard)/flags/page.tsx`_

## Stage 3: Verification

- [ ] T-010: Run `pnpm --filter dashboard test` — confirm all 25+ tests pass (11 existing FlagCard + 1 new data + 7 new action + 6 new toggle)
- [ ] T-011: Run `pnpm --filter dashboard typecheck` — confirm zero type errors
