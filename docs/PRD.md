# Flag Pilot — Product Requirements Document

> **Status**: Draft v1
> **Author**: Juan Camilo Rico Orjuela
> **Date**: 2026-06-18

## 1. Problem Statement

Teams need to ship new features continuously without risking production stability. Without a feature flag system, each change requires a full deployment to activate or roll back, making gradual rollouts, A/B testing, and emergency kill-switches expensive and slow.

Feature flags decouple deployment from release — code ships to production **off** and is toggled **on** when ready, for the right audience, at the right time.

## 2. Goals

- Allow developers to create, enable, and disable feature flags through a web dashboard
- Allow applications to evaluate flag status in real time via a lightweight SDK
- Support percentage-based rollouts with consistent user targeting
- Maintain an audit trail of who changed what and when
- Keep flag evaluation latency under 50ms (cached path)

## 3. Non-Goals (explicitly out of scope for v1)

- Multi-tenant support (single workspace)
- User roles and permissions (single admin)
- A/B test result analytics (raw evaluation counts only)
- Webhooks or event streams
- Client-side SDK (browser) — SDK will be server-side first

## 4. User Personas

### Persona A: The Developer (Admin)

Uses the **Dashboard** to manage flags. Wants to create, configure, enable, and monitor feature flags without writing code or making deployments. Needs visibility into who changed what.

### Persona B: The Application (SDK Client)

Consumes the **Evaluation API** (directly or via SDK) to check whether a flag is active. Needs sub-50ms response times and consistent targeting (same user always gets the same result).

## 5. Use Cases

### Admin — Dashboard (CU-01 to CU-08)

| ID | Name | Description |
|----|------|-------------|
| CU-01 | Create a flag | Admin creates a new flag with name, description, and initial state (on/off) |
| CU-02 | List flags | Admin views all flags with their current state and last-modified info |
| CU-03 | Toggle a flag | Admin enables or disables a flag. Changes must reflect on clients within seconds |
| CU-04 | Delete a flag | Admin removes a flag that is no longer needed |
| CU-05 | View flag history | Admin sees who changed a flag, when, from what state to what, and optionally why |
| CU-06 | Segment by percentage | Admin configures a flag to be active for a percentage of users (e.g., 10%). Evaluations must be sticky — same user always gets the same result |
| CU-07 | Whitelist users | Admin activates a flag for specific user IDs (internal testing) |
| CU-08 | View basic metrics | Admin sees how many times a flag was evaluated and how many users see each variant |

### Client — SDK (CU-09 to CU-10)

| ID | Name | Description |
|----|------|-------------|
| CU-09 | Evaluate by flag name | Client asks "is flag `new-checkout` active?" and receives boolean. No user context needed |
| CU-10 | Evaluate with user context | Client asks "is flag `new-checkout` active for user `123`?" with percentage or whitelist targeting |

## 6. Scope: MVP vs Future

### MVP (v1)

- CRUD flags
- Toggle on/off
- Percentage-based rollout (sticky via user ID hash)
- User whitelist
- Evaluation API (REST endpoint)
- Audit log
- Basic dashboard

### Future iterations

- User roles (admin / viewer / manager)
- SDK npm package (server-side)
- A/B test analytics
- Webhooks on flag change
- Client-side SDK (browser)
- Multi-environment (dev / staging / prod)

## 7. Open Questions

- [ ] Should the SDK use polling or server-sent events for flag updates?
- [ ] Cache invalidation strategy when a flag is toggled — TTL vs pub/sub?
- [ ] Authentication method for the dashboard (session? API key? JWT?)
