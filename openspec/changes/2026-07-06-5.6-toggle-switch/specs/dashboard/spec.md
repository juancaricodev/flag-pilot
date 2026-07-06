# Delta for Dashboard

## ADDED Requirements

### Requirement: ToggleFlag Server Action

The system MUST provide a `toggleFlag(flagId, enabled)` Server Action that toggles a flag's enabled state via the API and invalidates the client cache.

- **Scenario: Success** — GIVEN a valid auth cookie exists AND the API returns 200, WHEN `toggleFlag` is called with a flag ID and enabled state, THEN it MUST return `{ success: true }` AND MUST call `revalidateTag('flags')`.
- **Scenario: API error** — GIVEN the API returns a 4xx/5xx with `{ message }`, WHEN `toggleFlag` is called, THEN it MUST return `{ error: message }`.
- **Scenario: Missing auth cookie** — GIVEN no `access_token` cookie exists, WHEN `toggleFlag` is called, THEN it MUST return `{ error: 'Not authenticated' }`.
- **Scenario: Network failure** — GIVEN the fetch throws a network error, WHEN `toggleFlag` is called, THEN it MUST return `{ error: err.message }`.

### Requirement: Toggle Switch — Render

The FlagCard MUST render a toggle switch when `onToggle` is provided, and MUST omit it when not.

- **Scenario: With onToggle** — GIVEN `FlagCard` receives an `onToggle` callback, WHEN the component renders, THEN it MUST include a `<button role="switch">` whose `aria-checked` equals `flag.enabled`.
- **Scenario: Without onToggle** — GIVEN `FlagCard` does not receive `onToggle`, WHEN the component renders, THEN it MUST NOT render a toggle button.

### Requirement: Toggle Click — Confirmation

The system SHALL use `window.confirm()` before executing the toggle, and SHALL NOT call the action if the user cancels.

- **Scenario: Confirmed** — GIVEN the toggle switch is clicked, WHEN the user confirms in `window.confirm()`, THEN `onToggle(flag.id, !flag.enabled)` MUST be called.
- **Scenario: Cancelled** — GIVEN the toggle switch is clicked, WHEN the user cancels `window.confirm()`, THEN `onToggle` MUST NOT be called.

### Requirement: Toggle Loading State

The toggle MUST be disabled while the action is in flight, and MUST re-enable on error.

- **Scenario: Disabled during action** — GIVEN `toggleFlag` is executing, WHEN the component is in a pending state, THEN the toggle button MUST have `disabled` attribute AND display reduced opacity.
- **Scenario: Re-enabled on error** — GIVEN `toggleFlag` returns an error, WHEN `onToggle` settles, THEN the toggle button MUST be enabled for retry.

### Requirement: Data Cache Invalidation

The data layer SHALL support tag-based revalidation for the flags list.

- **Scenario: getFlags uses cache tags** — GIVEN `getFlags()` fetches from the API, WHEN the fetch is made, THEN the request MUST include `next: { tags: ['flags'] }` to enable `revalidateTag`.
- **Scenario: Server Action revalidates** — GIVEN `toggleFlag` succeeds, WHEN `revalidateTag('flags')` is called, THEN subsequent `getFlags()` calls MUST refetch from the API.

### Requirement: Flags page passes onToggle

The Flags list page MUST pass `toggleFlag` as the `onToggle` prop to every `FlagCard`.

- **Scenario: onToggle wired** — GIVEN `FlagsPage` renders the flags grid, WHEN iterating over flags, THEN each `<FlagCard>` MUST receive `onToggle={toggleFlag}`.

## NON-FUNCTIONAL REQUIREMENTS

### Requirement: Accessible Toggle Pattern

The toggle switch MUST follow the ARIA switch pattern: `<button role="switch" aria-checked={flag.enabled}>`. CSS SHALL style the track and thumb with `translateX` for position changes and smooth transitions. The focus ring SHALL match the existing Button atom pattern.

### Requirement: Custom Modal UX Tracking

Custom confirmation modal replacement is tracked separately as UX enhancement work. This change intentionally uses `window.confirm()` as an MVP choice — the decision to replace it with a custom modal SHALL be revisited in a future UX track, not during this change.
