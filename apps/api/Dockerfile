# ============================================================
# Stage 1: Builder — compile native deps, generate Prisma, build TS
# ============================================================
FROM node:20-alpine AS builder

# Install pnpm via corepack (matches CI setup)
RUN corepack enable && corepack prepare pnpm@10.33.1 --activate

# Set working directory
WORKDIR /app

# Copy workspace config files first (Docker layer caching)
# These change rarely, so they cache well
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy shared package source (workspace dependency)
COPY packages/shared ./packages/shared

# Copy API package manifest
COPY apps/api/package.json ./apps/api/

# Install ALL dependencies (including devDeps for build)
# --frozen-lockfile: fail if lockfile is out of date
# This compiles bcrypt natively (needs gcc, python, make — all in node:20-alpine)
RUN pnpm install --frozen-lockfile

# Copy API source code
COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json apps/api/tsconfig.build.json apps/api/nest-cli.json ./apps/api/

# Copy Prisma schema (needed for generate)
COPY apps/api/prisma ./apps/api/prisma

# Generate Prisma Client — MUST happen at build time
# Output goes to apps/api/generated/prisma (per schema.prisma config)
RUN pnpm --filter api exec prisma generate

# Build TypeScript → JavaScript
RUN pnpm --filter api build

# ============================================================
# Stage 2: Production — runtime only, no build tools
# ============================================================
FROM node:20-alpine AS production

# Install pnpm (needed for runtime workspace resolution)
RUN corepack enable && corepack prepare pnpm@10.33.1 --activate

WORKDIR /app

# Copy workspace config files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy shared package source (needed at runtime for workspace: protocol)
COPY packages/shared ./packages/shared

# Copy API package.json (for production deps install)
COPY apps/api/package.json ./apps/api/

# Install production dependencies only (no devDeps, no build tools)
RUN pnpm install --frozen-lockfile --prod

# Copy compiled output from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy generated Prisma Client from builder
COPY --from=builder /app/apps/api/generated ./apps/api/generated

# Copy Prisma schema (needed for migrate deploy at runtime)
COPY apps/api/prisma ./apps/api/prisma

# Copy entrypoint script
COPY apps/api/docker-entrypoint.sh ./apps/api/

# Make entrypoint executable
RUN chmod +x apps/api/docker-entrypoint.sh

# API listens on port 3001
EXPOSE 3001

# Set working directory to API
WORKDIR /app/apps/api

# Run entrypoint: migrate + start
ENTRYPOINT ["sh", "docker-entrypoint.sh"]
