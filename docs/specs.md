# Flag Pilot — Specifications

> **Status**: Draft v1
> **Date**: 2026-06-19
> **Based on**: PRD v1, Design v1

---

## Domain: Flags Management

### Purpose

CRUD operations for feature flags. Admin creates, lists, views, updates, and deletes flags through the Dashboard.

---

### Requirement: Create a flag (UC-01)

The system MUST allow an admin to create a feature flag with a name, description, and initial enabled state.

#### Scenario: Happy path — create flag with default disabled state

- GIVEN the admin is authenticated on the Dashboard
- WHEN they submit a new flag with name `"new-checkout"` and description `"New checkout flow"`
- THEN the flag is created with `enabled: false`
- AND the flag appears in the flags list

#### Scenario: Edge case — duplicate flag name

- GIVEN a flag named `"new-checkout"` already exists
- WHEN the admin attempts to create another flag with the same name
- THEN the system MUST return a conflict error (409)
- AND the flag is not created

#### Scenario: Edge case — empty name

- GIVEN the admin is on the create flag form
- WHEN they submit with an empty name
- THEN the system MUST reject the request
- AND return a validation error

---

### Requirement: List flags (UC-02)

The system MUST display all flags with their current state (enabled/disabled), rollout percentage, and last-modified timestamp.

#### Scenario: Happy path — flags displayed

- GIVEN there are 3 flags in the system
- WHEN the admin navigates to the Dashboard home
- THEN they see all 3 flags
- AND each flag shows its name, enabled state, and last updated timestamp

#### Scenario: Edge case — no flags

- GIVEN there are no flags in the system
- WHEN the admin navigates to the Dashboard home
- THEN they see an empty state message indicating no flags exist

---

### Requirement: Toggle a flag (UC-03)

The system MUST allow an admin to enable or disable a flag. Changes MUST reflect on clients within seconds.

#### Scenario: Happy path — enable a flag

- GIVEN a flag exists with `enabled: false`
- WHEN the admin clicks the toggle switch and confirms
- THEN the flag is updated to `enabled: true`
- AND the change is persisted immediately
- AND the card reflects the new state instantly
- AND the audit log records the toggle action

#### Scenario: Happy path — disable a flag

- GIVEN a flag exists with `enabled: true`
- WHEN the admin clicks the toggle switch and confirms
- THEN the flag is updated to `enabled: false`
- AND the card reflects the new state instantly

#### Scenario: Cancelled toggle

- GIVEN a flag exists
- WHEN the admin clicks the toggle switch but cancels the confirmation dialog
- THEN the flag state is NOT changed

#### Scenario: Toggle loading state

- GIVEN the admin has confirmed a toggle action
- WHEN the server is processing the request
- THEN the toggle switch is disabled to prevent double-clicks

---

### Requirement: Delete a flag (UC-04)

The system MUST allow an admin to permanently delete a flag.

#### Scenario: Happy path — delete existing flag

- GIVEN a flag exists
- WHEN the admin deletes it
- THEN the flag is removed from the system
- AND it no longer appears in the flags list
- AND the audit log records the deletion

#### Scenario: Edge case — delete non-existent flag

- GIVEN a flag ID that does not exist
- WHEN the admin attempts to delete it
- THEN the system MUST return a not-found error (404)

---

## Domain: Audit

### Purpose

Track all changes made to flags — who changed what, when, and why.

---

### Requirement: View flag history (UC-05)

The system MUST record and display an audit trail of changes for each flag.

#### Scenario: Happy path — view audit log

- GIVEN a flag has been created, enabled, and disabled
- WHEN the admin views the flag's history
- THEN they see 3 entries ordered by most recent first
- AND each entry shows: action (`CREATE` | `TOGGLE` | `UPDATE` | `DELETE`), previous state, new state, timestamp, and optional reason

#### Scenario: Edge case — no history

- GIVEN a flag was just created and never modified
- WHEN the admin views the flag's history
- THEN they see a single entry for the creation event

---

## Domain: Targeting

### Purpose

Control which users see a feature flag — by percentage rollout or specific user whitelist.

---

### Requirement: Segment by percentage (UC-06)

The system MUST allow an admin to configure a flag to be active for a percentage of users (0-100%). Evaluations MUST be sticky — the same user always gets the same result.

#### Scenario: Happy path — set 10% rollout

- GIVEN a flag exists with `rolloutPct: 0`
- WHEN the admin sets rollout to 10%
- THEN the flag is updated with `rolloutPct: 10`
- AND user `"user_123"` evaluated 10 times always gets the same result (sticky)
- AND user `"user_456"` evaluated 10 times always gets the same result (sticky)

#### Scenario: Edge case — invalid percentage

- GIVEN the admin is configuring rollout
- WHEN they set rollout to -5 or 150
- THEN the system MUST reject the value
- AND return a validation error

#### Scenario: Sticky via hash

- GIVEN a flag has `rolloutPct: 50`
- WHEN user `"user_123"` is evaluated
- THEN the result is determined by `hashCode("user_123" + flagId) % 100 < 50`

---

### Requirement: Whitelist users (UC-07)

The system MUST allow an admin to activate a flag for specific user IDs.

#### Scenario: Happy path — add user to whitelist

- GIVEN a flag exists with `whitelist: []`
- WHEN the admin adds `"user_123"` and `"user_456"` to the whitelist
- THEN the flag whitelist contains `["user_123", "user_456"]`
- AND evaluation for those users returns `enabled: true` regardless of rollout percentage

#### Scenario: Whitelist takes precedence

- GIVEN a flag has `enabled: false` and `whitelist: ["user_123"]`
- WHEN user `"user_123"` is evaluated
- THEN the result is `true` (whitelist overrides enabled state)

---

## Domain: Evaluation

### Purpose

Allow applications (SDK clients) to check flag status in real time with sub-50ms latency.

---

### Requirement: Evaluate by flag name (UC-09)

The system MUST evaluate a flag by name and return whether it is enabled.

#### Scenario: Happy path — flag is enabled

- GIVEN a flag named `"new-checkout"` exists with `enabled: true`
- WHEN a client requests `POST /api/evaluate` with `{ "flag": "new-checkout" }`
- THEN the response is `{ "enabled": true }`
- AND the response time is under 50ms
- AND an evaluation event is recorded

#### Scenario: Edge case — flag does not exist

- GIVEN no flag named `"unknown-flag"` exists
- WHEN a client requests evaluation for `"unknown-flag"`
- THEN the response is `{ "enabled": false }`
- AND the HTTP status is 200 (not 404 — missing flags are safe-defaulted to disabled)

---

### Requirement: Evaluate with user context (UC-10)

The system MUST evaluate a flag taking into account percentage rollout and whitelist when a user ID is provided.

#### Scenario: Happy path — user in whitelist

- GIVEN a flag with `enabled: false`, `rolloutPct: 0`, `whitelist: ["user_123"]`
- WHEN a client requests `POST /api/evaluate/context` with `{ "flag": "new-checkout", "userId": "user_123" }`
- THEN the response is `{ "enabled": true }`

#### Scenario: Flag disabled — user not whitelisted

- GIVEN a flag with `enabled: false`, `rolloutPct: 0`, `whitelist: []`
- WHEN a client requests evaluation with `{ "flag": "new-checkout", "userId": "user_789" }`
- THEN the response is `{ "enabled": false }`

#### Scenario: User not in whitelist — within rollout

- GIVEN a flag with `enabled: true`, `rolloutPct: 50`, `whitelist: []`
- WHEN a client requests evaluation for a user whose hash falls within 50%
- THEN the response is `{ "enabled": true }`

#### Scenario: User not in whitelist — outside rollout

- GIVEN a flag with `enabled: true`, `rolloutPct: 50`, `whitelist: []`
- WHEN a client requests evaluation for a user whose hash falls outside 50%
- THEN the response is `{ "enabled": false }`

---

## Domain: Metrics

### Purpose

Basic visibility into flag usage — how many times a flag was evaluated.

---

### Requirement: View basic metrics (UC-08)

The system SHOULD display how many times a flag was evaluated and how many users see each variant (enabled vs disabled).

#### Scenario: Happy path — view flag metrics

- GIVEN a flag that has been evaluated 1000 times
- WHEN the admin views the flag's metrics
- THEN they see total evaluations: 1000
- AND they see the count of `true` vs `false` results

#### Scenario: Edge case — no evaluations

- GIVEN a newly created flag with zero evaluations
- WHEN the admin views metrics
- THEN they see total evaluations: 0

---

## Domain: Authentication

### Purpose

Secure the Dashboard — only authorized admins can manage flags.

---

### Requirement: Dashboard login

The system MUST authenticate admin users via email and password.

#### Scenario: Happy path — successful login

- GIVEN an admin account exists with known credentials
- WHEN the admin submits valid email and password
- THEN the system returns a JWT token
- AND sets it as an httpOnly cookie
- AND redirects to the Dashboard

#### Scenario: Edge case — invalid credentials

- GIVEN an admin account exists
- WHEN the admin submits an incorrect password
- THEN the system returns an unauthorized error (401)
- AND does NOT set any cookie

#### Scenario: Edge case — unauthenticated access

- GIVEN the admin is not logged in
- WHEN they attempt to access any Dashboard page
- THEN they are redirected to the login page
