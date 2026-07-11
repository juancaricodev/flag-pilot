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

The system MUST render a placeholder page for `/metrics` ONLY, acknowledging the feature is not yet implemented.
(Previously: Both `/audit` and `/metrics` showed "Coming soon" placeholders. The audit page now has a real timeline.)

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

### Requirement: FlagForm Molecule (UC-01, UC-04)

The system MUST provide a `FlagForm` client component that supports creating and editing flags.

| Scenario               | GIVEN                            | WHEN                 | THEN                                                                            |
| ---------------------- | -------------------------------- | -------------------- | ------------------------------------------------------------------------------- |
| Create — empty form    | `mode="create"`                  | renders              | All fields empty, button says "Create Flag"                                     |
| Edit — pre-populated   | `mode="edit"` with a `flag` prop | renders              | Fields show flag values, button says "Save Changes" AND a Delete button appears |
| Name required          | Form submitted                   | name is empty        | Error "Name is required" shown with `role="alert"`                              |
| Rollout bounds         | Rollout entered                  | below 0 or above 100 | Inline validation error shown                                                   |
| Rollout sync           | User drags slider                | —                    | Number input updates to match                                                   |
| Rollout sync (reverse) | User types in number             | —                    | Slider updates to match                                                         |
| Server error           | Action returns `{ error }`       | —                    | Error shown inline with `role="alert"`                                          |
| Success callback       | Action succeeds                  | `onSuccess` provided | `onSuccess()` is called                                                         |
| Tab order              | User presses Tab                 | —                    | Focus: name → description → enabled → rollout → submit                          |

### Requirement: Flag Server Actions (UC-01, UC-03, UC-04)

The system MUST provide `createFlag`, `updateFlag`, and `deleteFlag` Server Actions that call the API and invalidate cache.

| Scenario      | GIVEN                                  | WHEN          | THEN                                                                                                                           |
| ------------- | -------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Success       | Auth cookie exists, API returns 200    | Action called | Returns `{ success: true, flag }` (create/update) or `{ success: true }` (delete) AND calls `updateTag('flags')` + `refresh()` |
| API error     | API returns 4xx/5xx with `{ message }` | Action called | Returns `{ error: message }`                                                                                                   |
| No auth       | No `access_token` cookie               | Action called | Returns `{ error: 'Not authenticated' }`, fetch NOT called                                                                     |
| Network error | Fetch throws                           | Action called | Returns fallback error string                                                                                                  |

### Requirement: Create and Edit Flag Pages (UC-01, UC-04)

The system MUST provide `/flags/new` and `/flags/[id]/edit` routes.

| Scenario          | Route              | GIVEN              | WHEN    | THEN                                          |
| ----------------- | ------------------ | ------------------ | ------- | --------------------------------------------- |
| Create page       | `/flags/new`       | User navigates     | renders | FlagForm in create mode                       |
| Edit page         | `/flags/[id]/edit` | Valid flag ID      | renders | FlagForm in edit mode with flag data          |
| Create → redirect | `/flags/new`       | Form succeeds      | —       | Redirects to `/flags`                         |
| Edit → redirect   | `/flags/[id]/edit` | Form succeeds      | —       | Redirects to `/flags`                         |
| Delete confirm    | `/flags/[id]/edit` | User clicks Delete | —       | `window.confirm("Are you sure…?")` shown      |
| Delete confirmed  | `/flags/[id]/edit` | User confirms      | —       | `deleteFlag(id)` called, redirect to `/flags` |
| Delete cancelled  | `/flags/[id]/edit` | User cancels       | —       | No action, stays on edit page                 |

### Requirement: Flags Page Navigation (UC-02)

The system MUST provide a "New Flag" button on the flags list and an Edit link on each FlagCard.

| Scenario        | GIVEN                        | WHEN    | THEN                                                       |
| --------------- | ---------------------------- | ------- | ---------------------------------------------------------- |
| New Flag button | Flags page renders           | —       | A link to `/flags/new` is in the page header               |
| Edit link       | FlagCard receives `editHref` | renders | An "Edit" link with that `href` appears in the card footer |
| No edit link    | FlagCard without `editHref`  | renders | No "Edit" link rendered                                    |

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

### Requirement: FlagCard — Toggle Switch and Edit Link

The FlagCard MUST render a toggle switch when `onToggle` is provided, and MUST render an Edit link when `editHref` is provided. Each element MUST be omitted when its associated prop is absent.

**Scenario: With onToggle**

- GIVEN `FlagCard` receives an `onToggle` callback
- WHEN the component renders
- THEN it MUST include a `<button role="switch">` whose `aria-checked` equals `flag.enabled`

**Scenario: Without onToggle**

- GIVEN `FlagCard` does not receive `onToggle`
- WHEN the component renders
- THEN it MUST NOT render a toggle button

**Scenario: Edit link renders**

- GIVEN `FlagCard` receives an `editHref` prop
- WHEN the component renders
- THEN it MUST include an "Edit" link pointing to `editHref`

**Scenario: Without editHref**

- GIVEN `FlagCard` does not receive `editHref`
- WHEN the component renders
- THEN it MUST NOT render an Edit link

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

The data layer SHALL support tag-based revalidation for the flags list. All mutation Server Actions (`toggleFlag`, `createFlag`, `updateFlag`, `deleteFlag`) MUST call `updateTag('flags')` and `refresh()` on success.

**Scenario: getFlags uses cache tags**

- GIVEN `getFlags()` fetches from the API
- WHEN the fetch is made
- THEN the request MUST include `next: { tags: ['flags'] }` to enable cache revalidation

**Scenario: Server Action revalidates**

- GIVEN any mutation action (`toggleFlag`, `createFlag`, `updateFlag`, or `deleteFlag`) succeeds
- WHEN `updateTag('flags')` and `refresh()` are called
- THEN subsequent `getFlags()` calls MUST refetch from the API

### Requirement: Flags page passes onToggle

The Flags list page MUST pass `toggleFlag` as the `onToggle` prop to every `FlagCard`.

**Scenario: onToggle wired**

- GIVEN the Flags page renders the flags grid
- WHEN iterating over flags
- THEN each `<FlagCard>` MUST receive `onToggle={toggleFlag}`

### Requirement: Accessible Toggle Pattern

The toggle switch MUST follow the ARIA switch pattern: `<button role="switch" aria-checked={flag.enabled}>`. CSS SHALL style the track and thumb with `translateX` for position changes and smooth transitions. The focus ring SHALL match the existing Button atom pattern.

**Scenario: ARIA attributes**

- GIVEN the toggle is rendered
- WHEN the component mounts
- THEN it MUST have `role="switch"` and `aria-checked` matching the flag's enabled state

**Scenario: Keyboard interaction**

- GIVEN the toggle is focused
- WHEN the user presses Enter or Space
- THEN the toggle action MUST trigger after confirmation

### Requirement: Custom Modal UX Tracking

Custom confirmation modal replacement is tracked separately as UX enhancement work. This change intentionally uses `window.confirm()` as an MVP choice — the decision to replace it with a custom modal SHALL be revisited in a future UX track, not during this change.

### Requirement: GET /api/audit endpoint (API)

The API MUST expose a `GET /api/audit` endpoint, protected by AuthGuard, returning all audit logs with `flagName`, ordered by `createdAt` desc.

| Scenario                 | GIVEN                           | WHEN             | THEN                                                                    |
| ------------------------ | ------------------------------- | ---------------- | ----------------------------------------------------------------------- |
| Authenticated — has data | Valid JWT cookie AND logs exist | `GET /api/audit` | Status 200, array of `AuditLogEntry` each with `flagName`, newest first |
| Authenticated — empty    | Valid JWT cookie AND no logs    | `GET /api/audit` | Status 200, empty array `[]`                                            |
| Unauthenticated          | No valid JWT cookie             | `GET /api/audit` | Status 401                                                              |

### Requirement: AuditService.findAll() (API)

`AuditService` MUST provide `findAll()` that fetches all audit logs via Prisma with `flag` relation (`select: { name: true }`), ordered by `createdAt: 'desc'`, and maps results through `toEntry()` including `flagName`.

| Scenario                    | GIVEN                            | WHEN        | THEN                                                       |
| --------------------------- | -------------------------------- | ----------- | ---------------------------------------------------------- |
| Returns logs with flag name | Multiple logs on different flags | `findAll()` | Returns entries ordered newest-first, each with `flagName` |
| Empty DB                    | No audit logs exist              | `findAll()` | Returns `[]`                                               |

### Requirement: AuditLogEntry.flagName (Shared)

`AuditLogEntry` interface MUST add an optional `flagName?: string` field.

| Scenario            | GIVEN                                 | WHEN                | THEN                                          |
| ------------------- | ------------------------------------- | ------------------- | --------------------------------------------- |
| Backward compatible | Existing code imports `AuditLogEntry` | Compiles            | TypeScript MUST NOT error — field is optional |
| Populated via API   | `GET /api/audit` returns entry        | Inspecting response | `flagName` equals `flag.name` from DB         |

### Requirement: getAuditLogs() data fetcher (Dashboard)

Dashboard MUST provide `getAuditLogs()` in `src/data/audit.ts` following the same pattern as `getFlags()`: read `access_token` cookie, fetch with `next: { tags: ['audit'] }`, throw on errors.

| Scenario      | GIVEN                            | WHEN             | THEN                                                  |
| ------------- | -------------------------------- | ---------------- | ----------------------------------------------------- |
| Success       | Valid cookie, API 200 with array | `getAuditLogs()` | Returns typed `AuditLogEntry[]`                       |
| No auth       | No `access_token` cookie         | `getAuditLogs()` | Throws `Error('Not authenticated')`, fetch NOT called |
| API error     | API returns 4xx/5xx              | `getAuditLogs()` | Throws `Error` with status context                    |
| Network error | Fetch throws                     | `getAuditLogs()` | Throws `Error`                                        |

### Requirement: formatDateTime utility (Dashboard)

Dashboard MUST provide `formatDateTime(iso: string): string` in `src/utils/formatDateTime.ts` returning `"Jun 15, 2026, 10:15 AM"` format (UTC). Follows same pattern as `formatDate` with added time.

| Scenario            | GIVEN                    | WHEN               | THEN                               |
| ------------------- | ------------------------ | ------------------ | ---------------------------------- |
| Formats date + time | `"2026-06-15T12:00:00Z"` | `formatDateTime()` | Returns `"Jun 15, 2026, 12:00 PM"` |
| Midnight            | `"2026-01-01T00:00:00Z"` | `formatDateTime()` | Returns `"Jan 1, 2026, 12:00 AM"`  |
| Afternoon           | `"2026-06-15T14:30:00Z"` | `formatDateTime()` | Returns `"Jun 15, 2026, 2:30 PM"`  |

### Requirement: AuditEntry molecule (Dashboard)

Dashboard MUST provide an `AuditEntry` Server Component molecule that renders a timeline row: color-coded action badge, flag name link, human-readable description, and formatted timestamp.

| Scenario       | GIVEN                          | WHEN rendered     | THEN                                                      |
| -------------- | ------------------------------ | ----------------- | --------------------------------------------------------- |
| CREATE action  | `action === "CREATE"`          | Component renders | Badge: green (`--success`) AND description: "was created" |
| TOGGLE action  | `action === "TOGGLE"`          | Component renders | Badge: blue/accent AND description: "was toggled"         |
| UPDATE action  | `action === "UPDATE"`          | Component renders | Badge: amber (`--warning`) AND description: "was updated" |
| DELETE action  | `action === "DELETE"`          | Component renders | Badge: red (`--danger`) AND description: "was deleted"    |
| Flag name link | Entry has `flagId`, `flagName` | Component renders | Flag name is a link to `/flags/[flagId]/edit`             |
| Timestamp      | Entry has valid `createdAt`    | Component renders | Shows `formatDateTime(createdAt)` output                  |

### Requirement: Audit page — global timeline (Dashboard)

The `/audit` page MUST be a Server Component that calls `getAuditLogs()` and renders a vertical timeline. Replaces the existing placeholder.

| Scenario   | GIVEN                            | WHEN page renders | THEN                                                              |
| ---------- | -------------------------------- | ----------------- | ----------------------------------------------------------------- |
| Logs exist | `getAuditLogs()` returns entries | Page renders      | Shows "Audit Log" heading AND timeline of `AuditEntry` components |
| No logs    | `getAuditLogs()` returns `[]`    | Page renders      | Shows "Audit Log" heading AND "No audit logs yet" empty state     |
| API error  | `getAuditLogs()` throws          | Page renders      | Shows error state explaining logs could not be loaded             |
