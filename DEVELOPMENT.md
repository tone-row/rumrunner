# RumRunner Development Guide

## Quick Start

### Development Mode (Recommended)

```bash
# Install dependencies
bun install

# Start both API server and UI with hot reload
bun run dev
```

This will:

- Start the API server on port 3000
- Start the UI development server on port 5173 with hot reload
- Watch for changes and rebuild automatically

### Alternative Development Commands

```bash
# Start just the API server
bun run server

# Start just the UI with Vite dev server (hot reload)
bun run ui:dev

# Build the UI for production
bun run build:ui

# Preview the built UI
bun run preview:ui
```

## Testing

### Unit Tests

```bash
bun test
```

### End-to-End Tests

```bash
# Install Playwright browsers (first time only)
bun run install:browsers

# Run E2E tests
bun run test:e2e

# Run E2E tests with UI
bun run test:e2e:ui
```

## Architecture

### Development Setup

- **API Server** (`src/rumrunnerServer.ts`): Hono-based server serving API endpoints
- **UI** (`src/ui/`): React app with Vite for development
- **Dev Server** (`src/dev-server.ts`): Proxies API calls and serves UI during development

### Key Components

- **Cache System**: Multiple backends (JSON, SQLite) for function result caching
- **Product Expansion**: Cartesian product generation for parameter sweeps
- **UI**: React-based interface for viewing cache state and registered functions

## Troubleshooting

### Hot Reload Not Working

1. Make sure you're using `bun run dev` or `bun run ui:dev`
2. Check that Vite is running on port 5173
3. Verify the UI is being served from the correct directory

### API Server Issues

1. Check that the server is running on port 3000
2. Verify API endpoints are accessible at `http://localhost:3000/api/*`
3. Check the health endpoint: `http://localhost:3000/healthz`

### E2E Test Issues

1. Install Playwright browsers: `bun run install:browsers`
2. Make sure the API server is running before tests
3. Check that the UI is built and accessible

## File Structure

```
src/
├── cache/           # Cache backends (JSON, SQLite)
├── ui/             # React UI components
├── bin.ts          # CLI for creating new projects
├── dev-server.ts   # Development server with hot reload
├── rumrunnerServer.ts  # Main API server
└── index.ts        # Main library exports

test/
├── e2e.test.ts     # End-to-end tests
├── cache.test.ts   # Cache unit tests
└── product.spec.ts # Product expansion tests
```
