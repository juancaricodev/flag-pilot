# API Docker Specification

## Purpose

Containerize the NestJS API for production deployment via Docker Compose. The container MUST run Prisma migrations on startup and expose the API on a configurable port.

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

### Requirement: docker-entrypoint.sh

The API SHALL have a `docker-entrypoint.sh` script at `apps/api/docker-entrypoint.sh` that runs Prisma migrations before starting the API.

#### Scenario: Migrations apply on container start

- GIVEN the container starts with pending Prisma migrations
- WHEN `docker-entrypoint.sh` executes
- THEN `npx prisma migrate deploy` runs and applies all pending migrations
- AND the API starts via `exec node dist/main` after migrations succeed

#### Scenario: Migration failure stops container

- GIVEN the container starts and a Prisma migration fails
- WHEN `npx prisma migrate deploy` returns a non-zero exit code
- THEN the container exits immediately
- AND the previous container version remains running (if using rolling restart)

#### Scenario: Entrypoint replaces shell process

- GIVEN `docker-entrypoint.sh` starts successfully
- WHEN migrations complete
- THEN `exec node dist/main` replaces the shell with the Node.js process
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

#### Scenario: Compose file defines API and PostgreSQL services

- GIVEN `docker-compose.prod.yml` exists
- WHEN `docker compose -f docker-compose.prod.yml config` is run
- THEN the output contains an `api` service building from `apps/api/Dockerfile`
- AND the output contains a `postgres` service using `postgres:16-alpine`
- AND the `api` service depends on `postgres`

#### Scenario: PostgreSQL uses persistent volume

- GIVEN the compose file is parsed
- WHEN the `postgres` service is inspected
- THEN it defines a named volume for `/var/lib/postgresql/data`
- AND the volume persists across `docker compose down` / `docker compose up`

#### Scenario: API reads environment from file

- GIVEN the compose file is parsed
- WHEN the `api` service is inspected
- THEN it references environment variables (from `.env.prod` or inline)
- AND secrets are NOT baked into the Docker image
