# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

LacyLights Frontend is the web-based user interface for the LacyLights theatrical lighting control system. Built with Next.js and React, it provides a modern lighting console experience with real-time updates via GraphQL subscriptions.

**Role in LacyLights Ecosystem:**
- Primary user interface for lighting designers and operators
- Consumes GraphQL API from lacylights-go backend
- Real-time scene visualization and control
- Touch-optimized for mobile devices and tablets

## Development Commands

### Development Server
```bash
npm run dev              # Start Next.js dev server (http://localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run build:static     # Build for static export (RPi deployment)
npm run serve:static     # Serve static build locally
```

### Code Generation
```bash
npm run codegen          # Generate TypeScript types from GraphQL schema
npm run codegen:watch    # Watch mode for GraphQL codegen
```

### Testing
```bash
npm test                 # Run Jest unit tests
npm run test:watch       # Watch mode for tests
npm run test:coverage    # Generate coverage report
npm run test:ci          # CI mode with coverage
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:ui      # Run E2E tests with UI
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run lint:fix         # Fix auto-fixable lint issues
npm run lint:ci          # CI mode (warnings as errors)
npm run type-check       # TypeScript type checking
npm run check            # Run both type-check and lint
```

## Architecture

### Directory Structure

```
lacylights-fe/
├── src/
│   ├── app/             # Next.js App Router pages
│   ├── components/      # React components (flat structure)
│   │   └── __tests__/   # Component tests
│   ├── contexts/        # React Context providers
│   ├── hooks/           # Custom React hooks
│   ├── graphql/         # GraphQL queries and mutations
│   ├── generated/       # Auto-generated GraphQL types
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── lib/             # Library integrations (Apollo, etc.)
│   ├── constants/       # App-wide constants
│   └── data/            # Static data (fixture definitions)
├── public/              # Static assets
└── e2e/                 # Playwright E2E tests
```

### Key Technologies

- **Next.js 15**: React framework with App Router
- **React 18**: UI library with concurrent features
- **Apollo Client**: GraphQL client with caching
- **Tailwind CSS**: Utility-first styling
- **TypeScript**: Type-safe development
- **graphql-codegen**: Type generation from schema
- **Jest + Testing Library**: Unit testing
- **Playwright**: E2E testing

## Important Patterns

### GraphQL Integration
All backend communication uses Apollo Client with generated TypeScript types:

```typescript
// Queries are in src/graphql/
import { useQuery } from '@apollo/client';
import { GetProjectDocument } from '@/generated/graphql';

const { data, loading } = useQuery(GetProjectDocument, {
  variables: { id: projectId }
});
```

**After lacylights-go schema changes:**
1. Ensure backend is running
2. Run `npm run codegen` to regenerate types
3. Update queries/mutations in `src/graphql/`

### Component Structure
- Components use a flat directory structure
- Each component should have a corresponding test file
- Use custom hooks for shared logic
- Prefer composition over inheritance

### State Management
- **Apollo Cache**: Server state (projects, fixtures, scenes)
- **React Context**: UI state (selected project, theme)
- **Local State**: Component-specific state

### Real-time Updates
WebSocket subscriptions provide live updates:
- Scene activation changes
- Cue playback status
- DMX output monitoring

## Testing Guidelines

### Unit Tests
- Place tests in `__tests__/` directories alongside source files (e.g., `src/components/__tests__/`)
- Use React Testing Library
- Mock Apollo Client responses
- Test user interactions, not implementation

```typescript
// Example test pattern
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';

const mocks = [{ request: {...}, result: {...} }];

render(
  <MockedProvider mocks={mocks}>
    <Component />
  </MockedProvider>
);
```

### E2E Tests
- Use Playwright in `e2e/` directory
- Test complete user workflows
- Run against static build for consistency

### Coverage Requirements
- Lines: 61%
- Functions: 56%
- Branches: 51%
- Statements: 60%

## CI/CD

| Workflow | File | Purpose |
|----------|------|---------|
| CI | `ci.yml` | Tests, lint, type-check, build on PRs |
| Contract Tests | `contract-tests.yml` | Validate frontend queries against backend |
| Release | `release.yml` | Build and deploy releases |

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_GRAPHQL_URL` | `http://localhost:4000/graphql` | Backend GraphQL URL |
| `NEXT_PUBLIC_GRAPHQL_WS_URL` | `ws://localhost:4000/graphql` | WebSocket URL |
| `STATIC_EXPORT` | `false` | Enable static export mode |

### Services and Ports

| Service | Port | Description |
|---------|------|-------------|
| Next.js Dev | 3000 | Development server |
| Next.js Prod | 3000 | Production server |
| Static Server | 3000 | Static export server |

## Related Repositories

| Repository | Relationship |
|------------|--------------|
| [lacylights-go](https://github.com/bbernstein/lacylights-go) | Backend API this frontend consumes |
| [lacylights-mcp](https://github.com/bbernstein/lacylights-mcp) | MCP server for AI features |
| [lacylights-test](https://github.com/bbernstein/lacylights-test) | Integration tests for frontend+backend |
| [lacylights-terraform](https://github.com/bbernstein/lacylights-terraform) | Distribution infrastructure - releases uploaded here |
| [lacylights-rpi](https://github.com/bbernstein/lacylights-rpi) | Production platform - hosts this frontend on Raspberry Pi |
| [lacylights-mac](https://github.com/bbernstein/lacylights-mac) | Production platform - hosts this frontend on macOS |

## Important Notes

- Always run `npm run check` before committing
- GraphQL schema changes in backend require `npm run codegen`
- Static export mode disables API routes
- Use `npm run build:static` for RPi deployment
- Mobile-first design - test on touch devices

## Key Components

### Layout Canvas
- Pixel-based canvas (2000x2000px default)
- Touch gesture support for mobile
- Drag-and-drop fixture positioning

### Channel Sliders
- Real-time DMX channel control
- Fade behavior indicators
- Color picker integration

### Cue List
- Timeline-based cue management
- Fade time editing
- Playback controls
