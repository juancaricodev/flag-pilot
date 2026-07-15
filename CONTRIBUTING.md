# Contributing to Flag Pilot

> This guide covers the development workflow, coding standards, and contribution process.

---

## Development Workflow

Flag Pilot follows a **branch-based workflow** with pull requests and code review. No direct pushes to `main`.

### Branch Strategy

```
main ← develop ← feature/user-story-XXX ← your-code
```

1. **Always create a branch** from `main` before starting work
2. **Make your changes** with conventional commits
3. **Open a PR** when ready for review
4. **Get approval** and pass CI checks before merge
5. **Merge commit** into `main` — preserve the full development history

### Branch Naming

| Type          | Pattern                   | Example                         |
| ------------- | ------------------------- | ------------------------------- |
| Feature       | `feature/user-story-<id>` | `feature/user-story-12`         |
| Bug fix       | `fix/<description>`       | `fix/toggle-cache-invalidation` |
| Documentation | `docs/<description>`      | `docs/api-endpoints`            |
| Chore         | `chore/<description>`     | `chore/update-dependencies`     |

### Pull Request Process

1. **Title**: Use conventional commit format — `feat: add user roles`
2. **Description**: Link the user story or issue, describe what changed and why
3. **Self-review**: Check your own diff before requesting review
4. **CI must pass**: lint, typecheck, test, build
5. **Approval required**: At least 1 approval before merge
6. **Merge commit**: Preserve the full development history

---

## User Stories

Every feature starts with a user story. This ensures we build the right thing before we build it right.

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

## Spec-Driven Development (SDD)

Once a user story is approved, we follow the SDD flow to implement it. This ensures thoughtful, well-specified implementations.

### Phases

| #   | Phase       | What happens                                | Approval    |
| --- | ----------- | ------------------------------------------- | ----------- |
| 1   | **Explore** | Investigate codebase, understand context    | —           |
| 2   | **Propose** | Propose approach and scope                  | ✅ Required |
| 3   | **Spec**    | Write specifications with requirements      | ✅ Required |
| 4   | **Design**  | Technical design and architecture decisions | ✅ Required |
| 5   | **Tasks**   | Break down into implementation tasks        | ✅ Required |
| 6   | **Apply**   | Implement the code                          | —           |
| 7   | **Verify**  | Validate against specs                      | ✅ Required |

### Rules

- **Never skip phases** — each builds on the previous
- **Wait for approval** before moving to the next phase
- **Document decisions** in `docs/design.md`
- **Update tasks** in `docs/tasks.md` as you go

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
git checkout -b feature/user-story-XX

# 4. Start development
pnpm dev          # Run all apps
pnpm test         # Run all tests
pnpm typecheck    # Type check

# 5. When ready, push and create a PR
git push origin feature/user-story-XX
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
├── openspec/             # SDD artifacts
├── skills/               # AI agent skills
└── .github/workflows/    # CI/CD pipelines
```

---

## Need Help?

- Check `docs/design.md` for architecture decisions
- Check `docs/specs.md` for feature specifications
- Check `docs/post-mvp.md` for planned improvements
- Check `docs/backlog.md` for all pending work
