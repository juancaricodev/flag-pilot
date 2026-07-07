# Spec: Dashboard UI

## Domain: Dashboard UI — Atoms & Layout

### Requirement: Badge component

The system MUST provide a Badge atom that displays a flag's computed status as a colored label.

**Scenario: Happy path — enabled status**

- GIVEN the status is `"enabled"`
- WHEN the Badge is rendered
- THEN it MUST display the text "Enabled"
- AND it MUST use a green color scheme (`--success` / `--success-light`)

**Scenario: Happy path — disabled status**

- GIVEN the status is `"disabled"`
- WHEN the Badge is rendered
- THEN it MUST display the text "Disabled"
- AND it MUST use a neutral color scheme (`--bg-muted` / `--text-muted`)

**Scenario: Happy path — partial status**

- GIVEN the status is `"partial"`
- WHEN the Badge is rendered
- THEN it MUST display the text "Partial"
- AND it MUST use a warning color scheme (`--warning` / `--warning-light`)

**Scenario: Default variant**

- GIVEN no status is provided
- WHEN the Badge is rendered
- THEN it MUST default to "disabled" variant

### Requirement: Button component

The system MUST provide a Button atom with multiple variants for forms, sidebar, and actions.

**Scenario: Primary variant**

- GIVEN the variant is `"primary"` (default)
- WHEN the Button is rendered
- THEN it MUST display the `label` text
- AND it MUST use accent background (`--accent`) with white text (`--accent-text`)
- AND clicking it MUST call the `onClick` handler

**Scenario: Secondary variant**

- GIVEN the variant is `"secondary"`
- WHEN the Button is rendered
- THEN it MUST have a transparent background with border (`--border`)
- AND it MUST use the default text color (`--text`)

**Scenario: Ghost variant**

- GIVEN the variant is `"ghost"`
- WHEN the Button is rendered
- THEN it MUST have no background and no border
- AND it MUST use secondary text color (`--text-secondary`)

**Scenario: Disabled state**

- GIVEN the Button is rendered with `disabled={true}`
- THEN it MUST NOT respond to clicks
- AND it MUST use muted colors (`--text-disabled`)
- AND cursor MUST be `not-allowed`

**Scenario: Focus visible**

- WHEN the Button is focused via keyboard
- THEN it MUST show a visible focus ring (`--accent`)

### Requirement: Input component

The system MUST provide an Input atom for text fields in forms.

**Scenario: Default state**

- GIVEN the Input is rendered with a `label`
- WHEN no value is entered
- THEN it MUST display the label above the input field
- AND it MUST show the `placeholder` text inside the input

**Scenario: Error state**

- GIVEN the Input is rendered with `error="Error message"`
- THEN it MUST display the error message below the input
- AND it MUST use danger colors (`--danger`) for border and text

**Scenario: Disabled state**

- GIVEN the Input is rendered with `disabled={true}`
- THEN it MUST NOT be editable
- AND it MUST use muted styling

**Scenario: Forward ref**

- WHEN the Input is used in a form
- THEN it MUST forward the ref to the underlying `<input>` element for form libraries

### Requirement: Flag type — status field (API + shared)

The system MUST compute and return a `status` field on the Flag type.

**Scenario: Disabled status computation**

- GIVEN a flag has `enabled: false`
- WHEN `toFlag()` is called
- THEN `status` MUST be `"disabled"`

**Scenario: Partial status computation**

- GIVEN a flag has `enabled: true` AND `rolloutPct` is between 1 and 99 inclusive
- WHEN `toFlag()` is called
- THEN `status` MUST be `"partial"`

**Scenario: Enabled status computation**

- GIVEN a flag has `enabled: true` AND `rolloutPct` is exactly 0 or exactly 100
- WHEN `toFlag()` is called
- THEN `status` MUST be `"enabled"`

### Requirement: Sidebar Navigation

The sidebar MUST render brand text, navigation links (Flags, Audit Log, Metrics), and a Sign out button inside the (dashboard) route group layout. Active link highlighting SHALL use `usePathname()`.

**Scenario: All nav links render**

- GIVEN the sidebar is rendered on any dashboard page
- WHEN the component mounts
- THEN it MUST display links for "Flags", "Audit Log", and "Metrics" with correct `href` attributes

**Scenario: Active link — Flags**

- GIVEN the current pathname is `/flags`
- WHEN the sidebar renders
- THEN the "Flags" link MUST have an active state (class or `aria-current`)

**Scenario: Active link — Audit Log**

- GIVEN the current pathname is `/audit`
- WHEN the sidebar renders
- THEN the "Audit Log" link MUST have an active state

**Scenario: Active link — Metrics**

- GIVEN the current pathname is `/metrics`
- WHEN the sidebar renders
- THEN the "Metrics" link MUST have an active state

**Scenario: Navigating via a nav link**

- GIVEN the user clicks a navigation link
- WHEN the link is followed
- THEN the browser MUST navigate to the corresponding path

### Requirement: Sidebar Logout

The sidebar MUST provide a Sign out button integrated with the existing `logout()` Server Action.

**Scenario: Logout button renders as form**

- GIVEN the sidebar is rendered
- WHEN the component mounts
- THEN it MUST render a `<form>` whose `action` points to `logout()`

**Scenario: Logout clears session and redirects**

- GIVEN the user clicks Sign out
- WHEN the form submits
- THEN the `access_token` cookie MUST be cleared
- AND the browser MUST redirect to `/login`

### Requirement: Dashboard Layout

The (dashboard) route group layout MUST wrap authenticated pages in a sidebar + content area flex container.

**Scenario: Desktop layout dimensions**

- GIVEN the layout renders with page children
- WHEN the page loads
- THEN the sidebar MUST be 260px wide and sticky to the left edge
- AND the content area MUST fill the remaining viewport width
- AND the layout MUST span the full viewport height

### Requirement: Placeholder Pages

The system MUST render placeholder pages for `/audit` and `/metrics` acknowledging the feature is not yet implemented.

**Scenario: Audit placeholder**

- GIVEN the user navigates to `/audit`
- WHEN the page renders
- THEN it MUST display the heading "Audit Log"
- AND a "Coming soon" message

**Scenario: Metrics placeholder**

- GIVEN the user navigates to `/metrics`
- WHEN the page renders
- THEN it MUST display the heading "Metrics"
- AND a "Coming soon" message

### Requirement: Route Group Integrity

Route groups SHALL NOT alter public URL paths.

**Scenario: Flags URL preserved**

- GIVEN the Flags page moved into the (dashboard) route group
- WHEN the user visits `/flags`
- THEN the page MUST render at the same URL
- AND it MUST render inside the dashboard layout with sidebar

**Scenario: Login unaffected**

- GIVEN the user visits `/login`
- WHEN the page renders
- THEN it MUST NOT include the dashboard layout or sidebar

### Requirement: ToggleFlag Server Action

The system MUST provide a `toggleFlag(flagId, enabled)` Server Action that toggles a flag's enabled state via the API and invalidates the client cache.

**Scenario: Success**

- GIVEN a valid auth cookie exists AND the API returns 200
- WHEN `toggleFlag` is called with a flag ID and enabled state
- THEN it MUST return `{ success: true }`
- AND it MUST call `updateTag('flags')` and `refresh()` to invalidate cache

**Scenario: API error**

- GIVEN the API returns a 4xx/5xx with `{ message }`
- WHEN `toggleFlag` is called
- THEN it MUST return `{ error: message }`

**Scenario: Missing auth cookie**

- GIVEN no `access_token` cookie exists
- WHEN `toggleFlag` is called
- THEN it MUST return `{ error: 'Not authenticated' }`

**Scenario: Network failure**

- GIVEN the fetch throws a network error
- WHEN `toggleFlag` is called
- THEN it MUST return `{ error: 'Failed to toggle flag' }`

### Requirement: Toggle Switch — Render

The FlagCard MUST render a toggle switch when `onToggle` is provided, and MUST omit it when not.

**Scenario: With onToggle**

- GIVEN `FlagCard` receives an `onToggle` callback
- WHEN the component renders
- THEN it MUST include a `<button role="switch">` whose `aria-checked` equals `flag.enabled`

**Scenario: Without onToggle**

- GIVEN `FlagCard` does not receive `onToggle`
- WHEN the component renders
- THEN it MUST NOT render a toggle button

### Requirement: Toggle Click — Confirmation

The system SHALL use `window.confirm()` before executing the toggle, and SHALL NOT call the action if the user cancels.

**Scenario: Confirmed**

- GIVEN the toggle switch is clicked
- WHEN the user confirms in `window.confirm()`
- THEN `onToggle(flag.id, !flag.enabled)` MUST be called

**Scenario: Cancelled**

- GIVEN the toggle switch is clicked
- WHEN the user cancels `window.confirm()`
- THEN `onToggle` MUST NOT be called

### Requirement: Toggle Loading State

The toggle MUST be disabled while the action is in flight, and MUST re-enable on error.

**Scenario: Disabled during action**

- GIVEN `toggleFlag` is executing
- WHEN the component is in a pending state
- THEN the toggle button MUST have `disabled` attribute AND display reduced opacity

**Scenario: Re-enabled on error**

- GIVEN `toggleFlag` returns an error
- WHEN `onToggle` settles
- THEN the toggle button MUST be enabled for retry

### Requirement: Data Cache Invalidation

The data layer SHALL support tag-based revalidation for the flags list.

**Scenario: getFlags uses cache tags**

- GIVEN `getFlags()` fetches from the API
- WHEN the fetch is made
- THEN the request MUST include `next: { tags: ['flags'] }` to enable cache revalidation

**Scenario: Server Action revalidates**

- GIVEN `toggleFlag` succeeds
- WHEN `updateTag('flags')` and `refresh()` are called
- THEN subsequent `getFlags()` calls MUST refetch from the API

### Requirement: Accessible Toggle Pattern

The toggle switch MUST follow the ARIA switch pattern: `<button role="switch" aria-checked={flag.enabled}>`.

**Scenario: ARIA attributes**

- GIVEN the toggle is rendered
- WHEN the component mounts
- THEN it MUST have `role="switch"` and `aria-checked` matching the flag's enabled state

**Scenario: Keyboard interaction**

- GIVEN the toggle is focused
- WHEN the user presses Enter or Space
- THEN the toggle action MUST trigger after confirmation
