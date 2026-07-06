# Delta for Dashboard — Sidebar & Layout

## ADDED Requirements

### Requirement: Sidebar Navigation

The sidebar MUST render brand text, navigation links (Flags, Audit Log, Metrics), and a Sign out button inside the (dashboard) route group layout. Active link highlighting SHALL use `usePathname()`.

#### Scenario: All nav links render

- GIVEN the sidebar is rendered on any dashboard page
- WHEN the component mounts
- THEN it MUST display links for "Flags", "Audit Log", and "Metrics" with correct `href` attributes

#### Scenario: Active link — Flags

- GIVEN the current pathname is `/flags`
- WHEN the sidebar renders
- THEN the "Flags" link MUST have an active state (class or `aria-current`)

#### Scenario: Active link — Audit Log

- GIVEN the current pathname is `/audit`
- WHEN the sidebar renders
- THEN the "Audit Log" link MUST have an active state

#### Scenario: Active link — Metrics

- GIVEN the current pathname is `/metrics`
- WHEN the sidebar renders
- THEN the "Metrics" link MUST have an active state

#### Scenario: Navigating via a nav link

- GIVEN the user clicks a navigation link
- WHEN the link is followed
- THEN the browser MUST navigate to the corresponding path

### Requirement: Sidebar Logout

The sidebar MUST provide a Sign out button integrated with the existing `logout()` Server Action.

#### Scenario: Logout button renders as form

- GIVEN the sidebar is rendered
- WHEN the component mounts
- THEN it MUST render a `<form>` whose `action` points to `logout()`

#### Scenario: Logout clears session and redirects

- GIVEN the user clicks Sign out
- WHEN the form submits
- THEN the `access_token` cookie MUST be cleared
- AND the browser MUST redirect to `/login`

### Requirement: Dashboard Layout

The (dashboard) route group layout MUST wrap authenticated pages in a sidebar + content area flex container.

#### Scenario: Desktop layout dimensions

- GIVEN the layout renders with page children
- WHEN the page loads
- THEN the sidebar MUST be 260px wide and sticky to the left edge
- AND the content area MUST fill the remaining viewport width
- AND the layout MUST span the full viewport height

### Requirement: Placeholder Pages

The system MUST render placeholder pages for `/audit` and `/metrics` acknowledging the feature is not yet implemented.

#### Scenario: Audit placeholder

- GIVEN the user navigates to `/audit`
- WHEN the page renders
- THEN it MUST display the heading "Audit Log"
- AND a "Coming soon" message

#### Scenario: Metrics placeholder

- GIVEN the user navigates to `/metrics`
- WHEN the page renders
- THEN it MUST display the heading "Metrics"
- AND a "Coming soon" message

### Requirement: Route Group Integrity

Route groups SHALL NOT alter public URL paths.

#### Scenario: Flags URL preserved

- GIVEN the Flags page moved into the (dashboard) route group
- WHEN the user visits `/flags`
- THEN the page MUST render at the same URL
- AND it MUST render inside the dashboard layout with sidebar

#### Scenario: Login unaffected

- GIVEN the user visits `/login`
- WHEN the page renders
- THEN it MUST NOT include the dashboard layout or sidebar
