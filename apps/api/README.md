# Flag Pilot API

Feature flag management REST API built with NestJS.

## Tech Stack

- **Framework**: NestJS 11
- **ORM**: Prisma 6
- **Database**: PostgreSQL
- **Language**: TypeScript
- **Testing**: Jest

## Architecture

- **Screaming Architecture** — Code structure reveals the system's purpose
- **Hexagonal Architecture** — Domain logic isolated from infrastructure
- **SDD (Spec-Driven Development)** — Specifications before code

## Project Structure

```
src/
├── domains/          # Domain logic (pure, no dependencies)
│   ├── flag/         # Flag aggregate
│   ├── project/      # Project aggregate
│   └── environment/  # Environment aggregate
├── infrastructure/   # External concerns
│   ├── database/     # Prisma
│   ├── http/         # NestJS controllers
│   └── auth/         # Authentication
├── shared/           # Shared types and utilities
└── main.ts           # Application entry point
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm start:dev

# Run in production mode
pnpm start:prod
```

## Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

## API Endpoints

### Health Check

```http
GET /health
```

Response:

```json
{
  "status": "ok",
  "timestamp": "2026-07-14T10:00:00.000Z"
}
```

### Authentication

```http
POST /auth/login
POST /auth/register
POST /auth/logout
GET /auth/profile
```

### Flags

```http
GET /flags
GET /flags/:id
POST /flags
PATCH /flags/:id
DELETE /flags/:id
```

### Projects

```http
GET /projects
GET /projects/:id
POST /projects
PATCH /projects/:id
DELETE /projects/:id
```

## Database

### Migrations

```bash
# Run migrations
pnpm prisma migrate deploy

# Generate Prisma client
pnpm prisma generate

# Seed database
pnpm prisma db seed
```

## Deployment

### Docker

```bash
# Build image
docker build -t flag-pilot-api .

# Run container
docker run -p 3001:3001 flag-pilot-api
```

### Docker Compose (Production)

```bash
# Run with production environment
docker-compose --env-file .env.prod -f docker-compose.prod.yml up -d
```

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/flagpilot

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d

# Server
PORT=3001
NODE_ENV=production
```

## Learn More

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
