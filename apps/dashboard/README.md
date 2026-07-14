# Flag Pilot Dashboard

Feature flag management dashboard built with Next.js 16.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **React**: React 19
- **Language**: TypeScript
- **Styling**: CSS Modules + SCSS
- **State**: Server Components + Server Actions

## Architecture

- **Atomic Design**: atoms → molecules → organisms
- **Server Components by default** — `'use client'` only for interactivity
- **Server Actions** for all mutations — never fetch from client
- **No unit tests for page.tsx** — test data fetchers + components individually

## Project Structure

```
src/
├── app/              # App Router pages
├── components/       # Atomic Design components
│   ├── atoms/        # Basic UI elements
│   ├── molecules/    # Component combinations
│   └── organisms/    # Complex sections
├── actions/          # Server Actions
├── data/             # Data fetchers
└── styles/           # Global styles
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Open in browser
open http://localhost:3000
```

## Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:cov
```

## Environment Variables

```env
# API URL for Server Actions (server-side only)
API_URL=http://localhost:3001

# API URL for client components (exposed to browser)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Deployment

Automatically deployed to Vercel on push to `main`.

- **Production**: [flag-pilot-dashboard.vercel.app](https://flag-pilot-dashboard.vercel.app)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
