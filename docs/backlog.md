# Flag Pilot — Backlog

> All pending work: remaining MVP tasks + post-MVP improvements. Organized by priority and category.
>
> Last updated: 2026-07-15

---

## Pending MVP Tasks

Carried over from `docs/tasks.md`. These were part of the original MVP scope but deferred.

| #   | Task                                                       | Phase            | Notes                                                                                |
| --- | ---------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------ |
| 3.4 | Redis cache-aside layer (30s TTL)                          | API — Evaluation | Reduce latency on `/evaluate` endpoints. Adds operational complexity (Redis server). |
| 7.4 | E2E test: login → create flag → toggle → verify evaluation | Testing          | Critical path integration coverage. Requires Playwright setup.                       |

---

## Post-MVP — High Priority

Quick wins that significantly improve production readiness.

### Domain name + HTTPS with nginx

- **What**: Replace HTTP-only deployment with HTTPS via a custom domain.
- **Why**: Auth cookies use `secure: false` — vulnerable to interception over plain HTTP.
- **Scope**:
  1. Buy domain (e.g., `flagpilot.dev` — ~$10/year)
  2. Configure DNS: domain → Vercel (Dashboard), subdomain → EC2 (API)
  3. Add nginx reverse proxy on EC2 with Let's Encrypt SSL
  4. Re-enable `secure: true` on auth cookies
  5. Expose ports 80/443 instead of 3001
- **Architecture**: `Internet → :443 (HTTPS) → nginx → :3001 (HTTP) → API`
- **Gotcha**: Let's Encrypt does NOT issue certificates for IP addresses — a domain is required.
- **Ref**: `docs/post-mvp.md`

### PostgreSQL backup strategy

- **What**: Automated backups for production PostgreSQL on EC2.
- **Why**: If the EBS volume is lost or corrupted, all data is gone.
- **Options**:
  - `pg_dump` cron job (simple, free, manual restore)
  - AWS EBS snapshots (automated, ~$0.05/GB/month)
  - Logical replication to standby (overkill for portfolio)
- **Recommendation**: `pg_dump` daily is sufficient for a portfolio project.

### Per-flag metrics endpoint

- **What**: `GET /api/flags/:id/metrics` — individual flag evaluation stats.
- **Why**: Current metrics are global only. Per-flag stats would show total evaluations, enabled vs disabled breakdown, and potentially time-based trends.
- **UI**: Dedicated metrics section on `/flags/[id]/edit` or new `/flags/[id]/metrics` route.
- **Ref**: `docs/tasks.md` — task 5.8

---

## Post-MVP — UX / Product

Improvements to the user experience and visual design.

### Full UX/UI redesign

- **What**: Complete design pass — visual hierarchy, spacing, color system, micro-interactions.
- **Why**: The dashboard is functional but built for speed over polish.
- **Ideas**:
  - Refine design tokens, add animation tokens
  - Empty states for every list
  - Loading skeletons instead of spinners
  - Responsive adaptation for tablet
  - Dark mode polish
  - Error boundaries with fallback UI per route segment
  - Keyboard shortcuts for power users

### Error message handling

- **What**: Replace generic error messages with friendly, contextual, actionable ones.
- **Why**: Improve user experience when things go wrong.
- **Ideas**:
  - Toast notifications instead of static text
  - Distinguish between network, validation, and server errors
  - Natural language messages ("The server is taking too long. Try again.")
  - Retry button on recoverable errors

### Custom icons and branding assets

- **What**: Replace Next.js default SVGs with custom logo, favicon, and visual identity.
- **Why**: Own visual identity for the product.

### Landing page / marketing site

- **What**: Public-facing page to present Flag Pilot as a product.
- **Why**: The project has commercial potential. A landing page is the first step.
- **Ideas**:
  - Features section with screenshots/GIFs
  - Pricing tiers (free, pro, enterprise)
  - Waitlist / early access signup
  - Blog or changelog
  - SEO metadata, Open Graph, analytics

---

## Post-MVP — Features

New capabilities for the platform.

### User roles and permissions

- **What**: Support multiple roles (admin / viewer / manager) instead of single admin.
- **Why**: Allow teams to collaborate without giving everyone full control.
- **Ref**: PRD §3 (non-goal v1), PRD §6 (future)

### Multi-environment support

- **What**: Support dev / staging / prod with separate flag states per environment.
- **Why**: Promote a flag through environments before reaching production.
- **Ref**: PRD §6 (future)

### Webhooks on flag change

- **What**: Fire webhooks when flags are created, toggled, updated, or deleted.
- **Why**: Enable integrations (Slack notifications, CI/CD pipelines, etc.).
- **Ref**: PRD §3 (non-goal v1), PRD §6 (future)

### A/B test analytics

- **What**: Variant-level analytics to compare flag populations.
- **Why**: Understand how many users see each variant and measure impact.
- **Ref**: PRD §3 (non-goal v1), PRD §6 (future)

---

## Post-MVP — SDKs

Client libraries for consuming flags.

### Server-side SDK (`@flagpilot/sdk`)

- **What**: Lightweight Node.js SDK wrapping the Evaluation API.
- **Why**: Drop-in package so clients don't call raw HTTP endpoints.
- **Scope**:
  - `isEnabled(flagName)` — basic evaluation
  - `isEnabled(flagName, userId)` — contextual evaluation
  - Connection pooling / caching
- **Ref**: PRD §6 (future)

### Client-side SDK (browser)

- **What**: Lightweight JS SDK for frontend apps to evaluate flags directly.
- **Why**: Let SPAs and static sites consume flags without a backend proxy.
- **Security**: Exposes flag keys — suitable for non-sensitive flags only.
- **Ref**: PRD §3 (non-goal v1), PRD §6 (future)

### SDK update mechanism

- **What**: Decide how the SDK receives flag updates — polling or server-sent events.
- **Trade-offs**:
  - **Polling**: simpler, higher latency, constant load
  - **SSE**: real-time, persistent connections, more complex infrastructure
- **Ref**: PRD §8 (open question)

---

## Post-MVP — Big Bets

Larger initiatives that require significant investment.

### React Native mobile app

- **What**: Native app to manage feature flags from a phone.
- **Why**: Learn React Native with a real project.
- **Scope**: JWT login, flag list with toggle, basic metrics, push notifications.

### Multi-tenant support

- **What**: Multiple organizations/workspaces with data isolation.
- **Why**: Allow the product to be offered as a SaaS with per-tenant flag isolation.
- **Ref**: PRD §3 (non-goal v1)

---

## Post-MVP — Tooling

Developer experience improvements.

### Prettier — multi-line arrow function style

- **What**: Configure Prettier to allow multi-line single-expression arrow functions.
- **Why**: Consistency with personal coding style.
- **Status**: Pending research — find option or plugin.
- **Ref**: `improvements/prettier-style` (engram #56)

---

## Summary

| Category      | Items  | Quick Wins                                   |
| ------------- | ------ | -------------------------------------------- |
| Pending MVP   | 2      | —                                            |
| High Priority | 3      | Domain + HTTPS, PG backups, Per-flag metrics |
| UX / Product  | 4      | —                                            |
| Features      | 4      | —                                            |
| SDKs          | 3      | —                                            |
| Big Bets      | 2      | —                                            |
| Tooling       | 1      | —                                            |
| **Total**     | **19** | **3**                                        |
