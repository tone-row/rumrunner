# rumrunner

A TypeScript toolkit featuring powerful caching solutions and project bootstrapping capabilities.

## Features

- 💾 Multiple caching backends (JSON and SQLite)
- 🔄 Version-based cache invalidation
- 🎯 Type-safe function wrapping
- 🚀 Instant project setup with TypeScript and Bun
- 🎭 Playwright integration for web scraping
- 🤖 AI integration with Anthropic and OpenAI

## Installation

```bash
bun install -g rumrunner
```

## Caching

Rumrunner provides two caching implementations: `SingleJsonCache` for simple file-based caching and `FileSQLiteCache` for more robust SQLite-based caching.

### JSON Cache

Simple file-based caching that stores data in a JSON file:

```typescript
import { SingleJsonCache } from "rumrunner";

// Initialize cache (defaults to ./cache.json)
const cache = new SingleJsonCache();
// Or specify a custom path
const cache = new SingleJsonCache("./custom-cache.json");

// Basic operations
await cache.set("key:1", "value");
const value = await cache.get("key:1");
const exists = await cache.has("key:1");
await cache.delete("key:1");
await cache.clear();

// Cache with fallback
const value = await cache.getWithFallback("data:1", async () => {
  // Expensive operation here
  return computedValue;
});

// Function wrapping with type safety
async function fetchUser(id: number): Promise<User> {
  // Expensive API call...
  return user;
}

const cachedFetchUser = cache.wrap<User, [number]>(
  "user:1", // Cache key with version
  fetchUser
);

// Now calls will be cached
const user1 = await cachedFetchUser(1); // Cache miss
const user2 = await cachedFetchUser(1); // Cache hit
```

### SQLite Cache

More robust caching using SQLite, ideal for larger datasets or when you need better query performance:

```typescript
import { FileSQLiteCache } from "rumrunner";

// Initialize cache
const cache = new FileSQLiteCache("./cache.db");

// Same interface as JSON cache
await cache.set("key:1", "value");
const value = await cache.get("key:1");

// Great for caching API responses
const cachedFetch = cache.wrap<Response, [string]>(
  "api:1",
  async (url: string) => {
    const response = await fetch(url);
    return response.json();
  }
);

// Cache complex objects with multiple parameters
interface SearchResult {
  query: string;
  page: number;
  results: string[];
}

const cachedSearch = cache.wrap<
  SearchResult,
  [string, number, { type: string }]
>("search:1", async (query, page, filters) => {
  // Expensive search operation...
  return results;
});

// Type-safe usage
const results = await cachedSearch("query", 1, { type: "all" });
```

### Version-based Cache Invalidation

Both cache implementations support version-based invalidation:

```typescript
// Version 1 of the cache
const v1 = cache.wrap("data:1", fetchData);

// Later, when you need to invalidate:
const v2 = cache.wrap("data:2", fetchData);
// All v1 entries are automatically cleaned up
```

## Project Bootstrapping

Create a new TypeScript project with all the essentials:

```bash
# Create a new project
rumrunner

# This will:
# 1. Create a new directory
# 2. Set up TypeScript configuration
# 3. Install dependencies
# 4. Open your editor
# 5. Change to the project directory

# Start your development server
bun run --watch index.ts
```

## Environment Variables

Store your API keys and configuration in `~/.rumrunner`:

```bash
# ~/.rumrunner
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
DEBUG=true  # Enable detailed cache logging
```

The CLI automatically copies this file to `.env` in new projects.

## Debug Logging

Set `DEBUG=true` in your environment to enable detailed cache logging:

- Cache hits and misses
- Cache version changes
- Storage operations

## Project Structure

```
your-project/
├── .env              # Created from ~/.rumrunner
├── cache.json        # JSON cache storage (if using SingleJsonCache)
├── cache.db         # SQLite cache storage (if using FileSQLiteCache)
├── index.ts         # Main entry point
├── package.json     # Project dependencies
└── tsconfig.json    # TypeScript configuration
```

## Dependencies

- Bun runtime
- TypeScript
- Playwright (optional, for web automation)
- AI SDKs (optional, for AI integration)

## License

MIT
