# Post-MVP Improvements

> Ideas and enhancements for after the MVP. Living document — updated as new ideas come up during development.

---

## Full UX/UI redesign

- **Context**: The current dashboard is functional but was built for speed over polish. Post-MVP needs a full design pass — visual hierarchy, spacing, color system refinement, micro-interactions, responsive behavior, loading states, empty states, error states.
- **Motivation**: A polished UX is what turns a tool into a product worth paying for.
- **Ideas**:
  - Design system evolution: refine tokens, add animation tokens, add component library
  - Empty states for every list (no flags yet, no audit entries yet)
  - Loading skeletons instead of spinners
  - Responsive adaptation for tablet (not just desktop-first)
  - Dark mode polish
  - Error boundaries with fallback UI per route segment
  - Keyboard shortcuts for power users

---

## UX — Error message handling

- **Context**: Current error messages are functional but generic (e.g. "Login failed (500)"). Post-MVP they should be friendly, contextual, and actionable.
- **Motivation**: Improve user experience when things go wrong.
- **Ideas**:
  - Toast notifications instead of static text
  - Distinguish between network, validation, and server errors
  - Natural language messages ("The server is taking too long. Try again.")
  - Retry button on recoverable errors

---

## React Native mobile app

- **Context**: Native app to manage feature flags from a phone.
- **Motivation**: Learn React Native with a real project we already have.
- **Tentative scope**:
  - JWT login
  - Flag list with toggle
  - Basic metrics
  - Push notifications (flag state changes)

---

## Prettier — multi-line arrow function style

- **Context**: Prettier forces single-expression arrow functions to one line. The user prefers multi-line format for readability.
- **Motivation**: Consistency with the developer's personal coding style.
- **Status**: Pending research — find an option or plugin that allows `const fn = (x: string) =>\n  x.startsWith('foo')` without breaking other rules.
- **Ref**: `improvements/prettier-style` (engram #56)

---

## Redis cache-aside layer for Evaluation API

- **Context**: Phase 3.4 (pending task). Add a cache-aside layer with Redis for evaluation results with a 30s TTL.
- **Motivation**: Reduce latency on evaluation endpoints (sub-50ms) and avoid unnecessary load on PostgreSQL.
- **Trade-offs**:
  - - Operational complexity (Redis server)
  - - Cache misses / stale reads (up to 30s)
  - - Performance on repeated reads of the same flag
- **Ref**: `docs/tasks.md` — task 3.4

---

## Custom icons and branding assets

- **Context**: Currently using Next.js default SVGs. Post-MVP replace with custom assets (logo, favicon, etc.).
- **Motivation**: Own visual identity for the product.

---

## Missing E2E test

- **Context**: Phase 7.4 is pending — an end-to-end test covering the full flow: login → create flag → toggle → verify evaluation.
- **Motivation**: Integration coverage of the product's critical path.
- **Ref**: `docs/tasks.md` — task 7.4

---

## User roles and permissions

- **Context**: Currently single admin only. Post-MVP support multiple roles (admin / viewer / manager).
- **Motivation**: Allow teams to collaborate without giving everyone full control.
- **Ref**: PRD §3 (non-goal v1), PRD §6 (future)

---

## Server-side SDK npm package

- **Context**: Lightweight Node.js SDK package that wraps the Evaluation API for server-side apps.
- **Motivation**: Provide a drop-in `@flagpilot/sdk` so clients don't have to call raw HTTP endpoints.
- **Tentative scope**:
  - `isEnabled(flagName)` — basic evaluation (UC-09)
  - `isEnabled(flagName, userId)` — contextual evaluation (UC-10)
  - Connection pooling / caching
- **Ref**: PRD §6 (future)

---

## A/B test analytics

- **Context**: Currently only raw evaluation counts. Post-MVP add variant-level analytics to compare flag populations.
- **Motivation**: Understand how many users see each variant and measure impact.
- **Ref**: PRD §3 (non-goal v1), PRD §6 (future)

---

## Webhooks on flag change

- **Context**: When a flag is created, toggled, updated, or deleted, fire a webhook to notify external systems.
- **Motivation**: Enable integrations (Slack notifications, CI/CD pipelines, etc.).
- **Ref**: PRD §3 (non-goal v1), PRD §6 (future)

---

## Client-side SDK (browser)

- **Context**: Lightweight JS SDK for frontend apps to evaluate flags directly from the browser.
- **Motivation**: Let SPAs and static sites consume flags without a backend proxy.
- **Security consideration**: Client-side evaluation exposes flag keys — suitable for non-sensitive flags only.
- **Ref**: PRD §3 (non-goal v1), PRD §6 (future)

---

## Multi-environment support

- **Context**: Currently a single environment. Post-MVP support dev / staging / prod with separate flag states per environment.
- **Motivation**: Promote a flag through environments before reaching production.
- **Ref**: PRD §6 (future)

---

## SDK update mechanism: polling vs server-sent events

- **Context**: Decide how the SDK receives flag updates — periodic polling or SSE (server-sent events).
- **Motivation**: Trade-off between latency and server load:
  - **Polling**: simpler, higher latency, constant load
  - **SSE**: real-time, persistent connections, more complex infrastructure
- **Ref**: PRD §8 (open question)

---

## Multi-tenant support

- **Context**: Currently single workspace. Post-MVP support multiple organizations/workspaces with data isolation.
- **Motivation**: Allow the product to be offered as a SaaS with per-tenant flag isolation.
- **Ref**: PRD §3 (non-goal v1)

---

## Landing page / marketing site

- **Context**: Build a public-facing landing page to present Flag Pilot as a product — value proposition, features, screenshots, pricing tiers, call-to-action.
- **Motivation**: The project has commercial potential. A landing page is the first step toward selling it.
- **Ideas**:
  - Product website (separate app or `/landing` route in dashboard)
  - Features section with screenshots/GIFs of the dashboard
  - Pricing tiers (free tier, pro, enterprise)
  - Waitlist / early access signup
  - Blog or changelog
  - SEO metadata, Open Graph, analytics
