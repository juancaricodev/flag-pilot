# Flag Pilot — Project Guidelines

## How to Use This Guide

- Start here for project-wide norms. Flag Pilot is a monorepo with two applications.
- Each component MAY have its own `AGENTS.md` with specific guidelines (e.g., `apps/api/AGENTS.md`, `apps/dashboard/AGENTS.md`).
- Component docs override this file when guidance conflicts.

---

## Available Skills

Use these skills for detailed patterns on-demand:

### Project Skills

| Skill                  | Description                                                        | URL                                              |
| ---------------------- | ------------------------------------------------------------------ | ------------------------------------------------ |
| `flag-pilot-dashboard` | Atomic Design, CSS Modules, Server Actions, Next.js 16 conventions | [SKILL.md](skills/flag-pilot-dashboard/SKILL.md) |
| `flag-pilot-api`       | NestJS 11, Prisma 6, Screaming Architecture, DTO validation        | [SKILL.md](skills/flag-pilot-api/SKILL.md)       |

### Generic Skills

| Skill            | Description                                | URL |
| ---------------- | ------------------------------------------ | --- |
| `go-testing`     | Go testing patterns, Bubbletea TUI testing | —   |
| `skill-creator`  | Create new AI agent skills                 | —   |
| `branch-pr`      | PR creation workflow                       | —   |
| `issue-creation` | Issue creation workflow                    | —   |
| `judgment-day`   | Parallel adversarial code review           | —   |

---

## Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action                                                                          | Skill                  |
| ------------------------------------------------------------------------------- | ---------------------- |
| Editing files in `apps/dashboard/`, creating components, writing Server Actions | `flag-pilot-dashboard` |
| Editing files in `apps/api/`, creating NestJS modules, writing API tests        | `flag-pilot-api`       |
| Writing Go tests, using teatest, adding test coverage                           | `go-testing`           |
| Creating a new skill, adding agent instructions                                 | `skill-creator`        |
| Creating a pull request                                                         | `branch-pr`            |
| Creating a GitHub issue                                                         | `issue-creation`       |
| Running adversarial code review                                                 | `judgment-day`         |

---

## Project Overview

Flag Pilot is a feature flag management system with a dashboard UI and a REST API.

| Component | Location           | Tech Stack                              |
| --------- | ------------------ | --------------------------------------- |
| Dashboard | `apps/dashboard/`  | Next.js 16, React 19, Sass, CSS Modules |
| API       | `apps/api/`        | NestJS 11, Prisma 6, PostgreSQL         |
| Shared    | `packages/shared/` | TypeScript                              |

---

## Development

```bash
# Install dependencies
pnpm install

# Run all apps in dev mode
pnpm dev

# Build all apps
pnpm build

# Run all tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format
```

### Per-app commands

```bash
# Dashboard
pnpm --filter dashboard dev       # Dev server
pnpm --filter dashboard test      # Tests
pnpm --filter dashboard typecheck # Type check

# API
pnpm --filter api start:dev       # Dev server (watch)
pnpm --filter api test            # Unit tests
pnpm --filter api test:e2e        # E2E tests (requires Docker)
pnpm --filter api test:cov        # Coverage
```

---

## Development Workflow

> **Rule: No direct pushes to `main`.** All work goes through branches and pull requests.

Use **Organic Driven Development (ODD)**. Follow the [contribution workflow](CONTRIBUTING.md#organic-driven-development-odd) for routing and verification.

### Quick Reference

- **Branch**: `<type>/<description>` — semantic (e.g. `feat/redis-cache-aside`, `docs/comment-convention`). Traceability links live in the PR, not the branch name
- **PR**: Conventional commit title, link the user story or issue, CI must pass
- **Merge**: Merge commit with at least 1 approval (no squash — preserve full history)
- **Intake**: New features require a user story with `status:approved` before implementation. Small fixes, docs, and chores do not need that label before work starts; their PR still links to an issue.
- **Routing**: Work inline by default. Track substantial work in one `odd/tasks/<feature>.md` with an Engram mirror. Delegate only for a concrete mapping, parallel implementation, or high-risk verification need. Pass matching skill paths and test commands to any delegate.
- **Verification**: Use RED → GREEN → REFACTOR when a runnable deterministic test can cover the behavior change. For documentation-only changes, check the changed text and references. Keep Receipt-Driven Development (RDD) settings and delivery decisions under human control.

### Commit Convention

Follow conventional-commit style: `<type>(<scope>): <description>`

**Types:** `feat`, `fix`, `docs`, `chore`, `perf`, `refactor`, `style`, `test`

**Scopes:** `api`, `dashboard`, `shared`, `ci`, `docs`

Rules:

- Commits must be in English

### Documentation Updates

Update the relevant documentation on the same branch before the final commit:

1. `docs/tasks.md` — mark completed items with `[x]`
2. `docs/design.md` — document architecture decisions made
3. `docs/specs.md` — add new requirements if applicable
4. [`docs/specs/`](docs/specs/) — update permanent requirements when they change

Ship feature documentation in the same PR as the feature. Keep the permanent requirements in `docs/specs/` separate from work tracking in `odd/tasks/`.

---

## Architecture Principles

- **Server Actions** for ALL mutations in Dashboard — never fetch from client
- **Server Components by default** — add `'use client'` only for interactivity
- **CSS Modules + SCSS** only — no Tailwind, no CSS-in-JS
- **Atomic Design**: atoms/molecules/organisms in `src/components/`
- **snake_case** for PostgreSQL tables/columns, **camelCase** for TypeScript
- **No unit tests for page.tsx** — test data fetchers + components individually
- **E2E with Playwright** planned post-MVP
- **Code comments**: WHY only — explain non-obvious decisions (gotchas, contracts, tradeoffs). Keep task and spec IDs out of comments and test names; preserve traceability in PRs, commits, and task documents.
