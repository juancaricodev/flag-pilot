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

## Commit & Pull Request Guidelines

Follow conventional-commit style: `<type>: <description>`

**Types:** `feat`, `fix`, `docs`, `chore`, `perf`, `refactor`, `style`, `test`

Rules:

- Commits must be in English
- After completing any feature or change, ALWAYS update documentation BEFORE making the final commit:
  1. `openspec/` — mark tasks as `[x]` in the active change's `tasks.md`
  2. `docs/` — update relevant files: `tasks.md` (mark items), `design.md` (architecture decisions), `specs.md` (new requirements if applicable)
- Update `docs/` files directly (they are the portfolio-facing documentation), not through SDD phases

---

## Architecture Principles

- **Server Actions** for ALL mutations in Dashboard — never fetch from client
- **Server Components by default** — add `'use client'` only for interactivity
- **CSS Modules + SCSS** only — no Tailwind, no CSS-in-JS
- **Atomic Design**: atoms/molecules/organisms in `src/components/`
- **snake_case** for PostgreSQL tables/columns, **camelCase** for TypeScript
- **No unit tests for page.tsx** — test data fetchers + components individually
- **E2E with Playwright** planned post-MVP
