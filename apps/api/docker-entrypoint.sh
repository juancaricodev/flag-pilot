#!/bin/sh
set -e

echo "Running Prisma migrations..."
pnpm exec prisma migrate deploy

echo "Starting API server..."
exec node dist/main
