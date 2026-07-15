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

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide (branch naming, PR process, user stories, SDD flow).

### Quick Reference

- **Branch**: `feature/user-story-XXX` or `fix/<description>`
- **PR**: Conventional commit title, link user story, CI must pass
- **Merge**: Merge commit with at least 1 approval (no squash — preserve full history)
- **Flow**: User Story → SDD phases → Implementation → PR → Review → Merge

### Commit Convention

Follow conventional-commit style: `<type>(<scope>): <description>`

**Types:** `feat`, `fix`, `docs`, `chore`, `perf`, `refactor`, `style`, `test`

**Scopes:** `api`, `dashboard`, `shared`, `ci`, `docs`

Rules:

- Commits must be in English

### Documentation Updates

**After completing any feature or change, ALWAYS update documentation BEFORE making the final commit:**

1. `docs/tasks.md` — mark completed items with `[x]`
2. `docs/design.md` — document architecture decisions made
3. `docs/specs.md` — add new requirements if applicable
4. `openspec/specs/` — sync merged specs if requirements changed
5. `openspec/config.yaml` — update project context if architecture changed

- `docs/` is the portfolio-facing documentation — it must reflect the current state of the project
- `openspec/changes/` artifacts are gitignored and live only in Engram, but `openspec/specs/` + `config.yaml` are the permanent tracked record
- `openspec/config.yaml` at the root level (NOT `openspec/changes/`)

---

## Architecture Principles

- **Server Actions** for ALL mutations in Dashboard — never fetch from client
- **Server Components by default** — add `'use client'` only for interactivity
- **CSS Modules + SCSS** only — no Tailwind, no CSS-in-JS
- **Atomic Design**: atoms/molecules/organisms in `src/components/`
- **snake_case** for PostgreSQL tables/columns, **camelCase** for TypeScript
- **No unit tests for page.tsx** — test data fetchers + components individually
- **E2E with Playwright** planned post-MVP

---

## SDD Collaboration Protocol

The orchestrator (this agent) DELEGATES every SDD phase to the appropriate sub-agent (`sdd-*`). The orchestrator NEVER writes code or documentation directly — it coordinates, presents results, and waits for human approval.

### Orchestrator role

1. Launch the right sub-agent for the phase (e.g., `sdd-propose`, `sdd-spec`)
2. Present the sub-agent's result to the human
3. Wait for explicit approval before proceeding to the next phase
4. NEVER skip phases, write artifacts manually, or advance without approval

### Phase flow

| #   | Phase       | Sub-agent     | How it works                                             |
| --- | ----------- | ------------- | -------------------------------------------------------- |
| 1   | **Propose** | `sdd-propose` | Launch sub-agent → present result → WAIT for approval    |
| 2   | **Spec**    | `sdd-spec`    | Launch sub-agent → present result → WAIT for approval    |
| 3   | **Design**  | `sdd-design`  | Launch sub-agent → present result → WAIT for approval    |
| 4   | **Tasks**   | `sdd-tasks`   | Launch sub-agent → present result → WAIT for approval    |
| 5   | **Apply**   | `sdd-apply`   | Launch sub-agent ONLY after tasks approved               |
| 6   | **Verify**  | `sdd-verify`  | Launch sub-agent → present results → WAIT before archive |
| 7   | **Archive** | `sdd-archive` | Launch sub-agent ONLY with explicit confirmation         |

**Rule: "Delegate, present, wait"** — the orchestrator delegates the work to a sub-agent, presents the result, and pauses. Moving to the next phase without human approval is a violation of this protocol.

### Rules — Non-negotiable

1. **NEVER write code or documentation directly** — always delegate to sub-agents
2. **NEVER skip phases** — even if the human says "keep going", delegate to sub-agents in order
3. **Ask permission before writing** — if no sub-agent exists for a task, ASK the human before writing code or docs yourself
4. **Wait for approval** — between every phase, unless the human explicitly says otherwise

### Exceptions (when the human says "keep going")

- The orchestrator MAY skip the **wait** between phases
- The orchestrator MUST STILL delegate to sub-agents — "keep going" means "don't pause to ask me", NOT "do it yourself"
- If the human says "do it all with SDD", the orchestrator MUST clarify: "Do you want me to go phase by phase with approval, or do everything and show you the final result?"

### What "keep going" means

| ✅ Allowed                        | ❌ Not allowed                             |
| --------------------------------- | ------------------------------------------ |
| Skip the pause between phases     | Write code directly                        |
| Launch next sub-agent immediately | Write documentation directly               |
| Batch multiple phases in one go   | Skip delegation entirely                   |
| Assume approval for routine steps | Make architecture decisions without asking |
