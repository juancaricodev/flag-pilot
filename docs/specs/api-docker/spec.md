# API Docker Specification

## Purpose

Containerize the NestJS API for production deployment via Docker Compose. Migrations run via a separate init container (builder image), keeping the production API image clean of Prisma CLI.

## Requirements

### Requirement: Multi-stage Dockerfile

The API SHALL have a `Dockerfile` at `apps/api/Dockerfile` using a multi-stage build with two stages: builder and production.

#### Scenario: Builder stage installs dependencies and compiles

- GIVEN the Dockerfile builder stage
- WHEN the image is built
- THEN `pnpm install` runs with native dependencies (bcrypt, @prisma/engines) compiled
- AND `prisma generate` produces the Prisma client
- AND `pnpm build` compiles TypeScript to `dist/`

#### Scenario: Production stage copies only runtime artifacts

- GIVEN the builder stage has completed
- WHEN the production stage copies artifacts
- THEN only `dist/`, `generated/prisma/`, `node_modules/`, and `package.json` are copied
- AND TypeScript source, devDependencies, and Prisma CLI are excluded
- AND the final image uses `node:20-alpine` as the base

#### Scenario: Production image excludes build tools

- GIVEN the multi-stage build is complete
- WHEN inspecting the production image
- THEN gcc, make, python, and other build tools from the builder stage are NOT present
- AND the image size is smaller than a single-stage build

### Requirement: Init container for migrations

Migrations SHALL run via a separate `migrate` service using the builder image (which contains the Prisma CLI), NOT from the API entrypoint.

#### Scenario: Migrations run before API starts

- GIVEN `docker compose up -d` is executed
- WHEN the `migrate` service starts
- THEN it uses the builder image (has prisma CLI)
- AND runs `pnpm --filter api exec prisma migrate deploy`
- AND the API service waits for `migrate` to complete (`condition: service_completed_successfully`)

#### Scenario: Migration failure prevents API start

- GIVEN the `migrate` service runs and a Prisma migration fails
- WHEN `prisma migrate deploy` returns a non-zero exit code
- THEN the `migrate` container exits with error
- AND the API service does NOT start (dependency not satisfied)

#### Scenario: Migrations are idempotent

- GIVEN the database is up to date with all migrations applied
- WHEN `prisma migrate deploy` runs again
- THEN it completes successfully with no changes

### Requirement: docker-entrypoint.sh

The API SHALL have a `docker-entrypoint.sh` script at `apps/api/docker-entrypoint.sh` that starts the API server. It does NOT run migrations.

#### Scenario: Entrypoint starts API directly

- GIVEN the container starts (after migrations have completed)
- WHEN `docker-entrypoint.sh` executes
- THEN `exec node dist/main` starts the API
- AND the Node process becomes PID 1 and receives SIGTERM for graceful shutdown

### Requirement: .dockerignore

The API SHALL have a `.dockerignore` at the repository root that excludes files from the Docker build context.

#### Scenario: Build context excludes node_modules

- GIVEN the `.dockerignore` file exists
- WHEN `docker build` is run
- THEN `node_modules/` directories are excluded from the build context
- AND `docker-compose*.yml` files are excluded
- AND `.env*` files are excluded (prevents secret leakage)
- AND `coverage/`, `dist/`, `.git/` are excluded
- AND `*.md` files are excluded

### Requirement: docker-compose.prod.yml

The API SHALL have a `docker-compose.prod.yml` at the repository root defining production services.

#### Scenario: Compose file defines migrate, API, and PostgreSQL services

- GIVEN `docker-compose.prod.yml` exists
- WHEN `docker compose -f docker-compose.prod.yml config` is run
- THEN the output contains a `migrate` service building from the builder stage
- AND the output contains an `api` service building from the production stage
- AND the output contains a `postgres` service using `postgres:16-alpine`
- AND the `migrate` service depends on `postgres` (healthy)
- AND the `api` service depends on `postgres` (healthy) AND `migrate` (completed)

#### Scenario: PostgreSQL uses persistent volume

- GIVEN the compose file is parsed
- WHEN the `postgres` service is inspected
- THEN it defines a named volume for `/var/lib/postgresql/data`
- AND the volume persists across `docker compose down` / `docker compose up`

#### Scenario: API reads environment from file

- GIVEN the compose file is parsed
- WHEN services are inspected
- THEN they reference environment variables from `.env.prod` via `--env-file` flag
- AND secrets are NOT baked into the Docker image

#### Scenario: --env-file required for all commands

- GIVEN a `.env.prod` file exists at the project root
- WHEN any `docker compose` command is run
- THEN `--env-file .env.prod` MUST be passed
- AND environment variables (POSTGRES_PASSWORD, JWT_SECRET, DATABASE_URL) are properly substituted
