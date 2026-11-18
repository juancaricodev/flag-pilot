# Contributing to Flag Pilot

> This guide covers the development workflow, coding standards, and contribution process.

---

## Development Workflow

Flag Pilot follows a **branch-based workflow** with pull requests and code review. No direct pushes to `main`.

### Branch Strategy

```
main ← <type>/<description>
```

1. **Always create a branch** from `main` before starting work
2. **Make your changes** with conventional commits
3. **Open a PR** when ready for review
4. **Get approval** and pass CI checks before merge
5. **Merge commit** into `main` — preserve the full development history

### Branch Naming

| Type          | Pattern               | Example                         |
| ------------- | --------------------- | ------------------------------- |
| Feature       | `feat/<description>`  | `feat/redis-cache-aside`        |
| Bug fix       | `fix/<description>`   | `fix/toggle-cache-invalidation` |
| Documentation | `docs/<description>`  | `docs/api-endpoints`            |
| Chore         | `chore/<description>` | `chore/update-dependencies`     |

Branch names are **semantic** — they describe the change, not the ticket. User-story/issue traceability is linked in the PR body (`Closes #N`), never in the branch name.

### Pull Request Process

1. **Title**: Use conventional commit format — `feat: add user roles`
2. **Description**: Link the user story or issue, describe what changed and why
3. **Self-review**: Check your own diff before requesting review
4. **CI must pass**: lint, typecheck, test, build
5. **Approval required**: At least 1 approval before merge
6. **Merge commit**: Preserve the full development history

---

## User Stories

Before implementing a new feature, get its GitHub user story labeled `status:approved`. Small fixes, documentation changes, and chores can start without that label, but their PRs still link to an issue.

### Format

```markdown
## User Story #<id>: <title>

**As a** [role],
**I want to** [action],
**So that** [benefit].

### Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Technical Notes

- Relevant architecture decisions
- Affected components
- Dependencies or blockers
```

### Example

```markdown
## User Story #15: Per-flag evaluation metrics

**As a** feature flag manager,
**I want to** see evaluation metrics for each individual flag,
**So that** I can understand which flags are being used and make data-driven decisions.

### Acceptance Criteria

- [ ] GET /api/flags/:id/metrics returns total evaluations for the flag
- [ ] Response includes enabled vs disabled breakdown
- [ ] Flag edit page displays metrics section with the data
- [ ] Empty state when no evaluations exist yet

### Technical Notes

- New endpoint: GET /api/flags/:id/metrics
- Extends existing FlagService with metrics method
- Dashboard: add Metrics molecule to flag edit page
```

---

## Organic Driven Development (ODD)

Use the amount of planning and verification the change needs, rather than a fixed sequence of phases.

1. **Understand the change.** Confirm the outcome, inspect the relevant requirements in [the permanent specs](docs/specs/) or [the domain spec](docs/specs.md), and identify the affected packages. Resolve open product decisions before implementing. Include a rollback plan for risky changes.
2. **Choose how to track it.** If the original request and `git diff` are enough to resume the work, work directly without a task file. Otherwise keep one `odd/tasks/<feature>.md` with an Engram mirror under `odd/<feature>/tasks`. Work directly by default; delegate only for a concrete mapping, parallel implementation, or independent high-risk verification need.
3. **Verify and document it.** Run the checks relevant to the change. Record architecture decisions and their rationale in [the design guide](docs/design.md). Update the relevant permanent requirements and [MVP checklist](docs/tasks.md) as needed, in the same PR as the change.

### Tracked work

Start the task document with the objective, branch, delivery strategy, and test runner. Use these sections in order:

- `## Specs`: Number requirements as `S1`, `S2`, and so on. Quote the user's exact requirements and examples when capturing acceptance criteria.
- `## Tasks`: One line per task with its ID, linked spec IDs, route, status, and commit or verification evidence. Mark a task complete only after observing the result and its checks.
- `## Log`: Put the original request verbatim in `L1`, then append decisions, changes, and verification results.

### Verification

For behavior changes with a runnable deterministic test, use **RED → GREEN → REFACTOR**. Run the focused test and the applicable suite. Documentation-only changes need structural checks, such as checking links and renamed paths, not application tests.

Use `pnpm test` for the Jest suites and `pnpm build` for build verification. The dashboard uses React Testing Library for component tests; the API uses NestJS Testing and runs E2E with Supertest and Testcontainers via `pnpm --filter api test:e2e` (requires Docker). Use `pnpm --filter api test:cov` for API coverage. See the [CI checks](#cicd-pipeline) for lint and typechecking commands.

Receipt-Driven Development (RDD) adds an independent review for high-risk changes when enabled and consented to for that candidate. It does not replace verification or the normal PR approval. The contributor controls RDD settings and publishing decisions.

---

## Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

### Types

| Type       | When to use                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | New feature                                             |
| `fix`      | Bug fix                                                 |
| `docs`     | Documentation only                                      |
| `chore`    | Build, CI, dependencies                                 |
| `perf`     | Performance improvement                                 |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `style`    | Formatting, no code change                              |
| `test`     | Adding or updating tests                                |

### Scopes

| Scope       | Applies to           |
| ----------- | -------------------- |
| `api`       | `apps/api/`          |
| `dashboard` | `apps/dashboard/`    |
| `shared`    | `packages/shared/`   |
| `ci`        | `.github/workflows/` |
| `docs`      | `docs/`              |

### Examples

```
feat(api): add per-flag metrics endpoint
fix(dashboard): toggle cache invalidation
docs: update post-mvp backlog
chore(ci): re-enable E2E tests on PRs
test(api): add unit tests for metrics service
```

---

## CI/CD Pipeline

### CI — Runs on PRs and pushes to `main`

| Step      | Command                      | Must pass     |
| --------- | ---------------------------- | ------------- |
| Lint      | `pnpm lint`                  | ✅            |
| Typecheck | `pnpm typecheck`             | ✅            |
| Test      | `pnpm test`                  | ✅            |
| Build     | `pnpm build`                 | ✅            |
| E2E       | `pnpm --filter api test:e2e` | ✅ (PRs only) |

### CD — Runs on push to `main` only

| Step          | What it does                                |
| ------------- | ------------------------------------------- |
| Quality gates | Same as CI (lint, typecheck, test, build)   |
| Deploy        | SSH to EC2, pull, rebuild Docker containers |
| Health check  | Verify API responds on port 3001            |

---

## Getting Started

```bash
# 1. Clone the repo
git clone git@github.com:juancaricodev/flag-pilot.git
cd flag-pilot

# 2. Install dependencies
pnpm install

# 3. Create a branch
git checkout -b feat/your-feature

# 4. Start development
pnpm dev          # Run all apps
pnpm test         # Run all tests
pnpm typecheck    # Type check

# 5. When ready, push and create a PR
git push origin feat/your-feature
# Open PR on GitHub → wait for review → merge
```

---

## Project Structure

```
flag-pilot/
├── apps/
│   ├── api/              # NestJS 11 + Prisma 6
│   └── dashboard/        # Next.js 16 + React 19
├── packages/
│   └── shared/           # TypeScript types
├── docs/                 # Project documentation
│   └── specs/            # Permanent requirements
├── skills/               # AI agent skills
└── .github/workflows/    # CI/CD pipelines
```

---

## Need Help?

- Check `docs/design.md` for architecture decisions
- Check [the domain spec](docs/specs.md) and [permanent requirements](docs/specs/) for feature specifications
- Check `docs/post-mvp.md` for planned improvements
- Check `docs/backlog.md` for all pending work
