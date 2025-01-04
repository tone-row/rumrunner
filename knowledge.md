# Rumrunner Knowledge

## Caching

- Uses a higher-order function pattern for caching function results
- Cache key is based on stringified function arguments
- Logs cache hits and misses
- Works with sync and async functions
- Requires named caches with a colon (e.g. "myCache:0")
- Supports TypeScript generics for better type safety
- Persists cache to cache.json in project root
- Version-based cache invalidation using colon notation
- Automatically cleans up old cache versions

## Example Usage
```typescript
import { cache } from "rumrunner";

// Simple sync function
const randomNumber = cache("randomNumber:0", () => Math.random());

// Typed sync function
const hello = cache<string>("hello:0", (name: string) => `Hello, ${name}!`);

// Async function with complex input
const loadWebPage = cache<string>("loadWebPage:0", async ({ url }: { url: string }) => {
  const response = await fetch(url);
  return response.text();
});

// Usage
await loadWebPage({ url: "https://example.com" }); // Cache miss, writes to cache.json
await loadWebPage({ url: "https://example.com" }); // Cache hit from cache.json

// To invalidate cache, increment version number
const loadWebPageV2 = cache<string>("loadWebPage:1", async ({ url }) => {
  // New version automatically cleans up loadWebPage:0 entries
  const response = await fetch(url);
  return response.text();
});
```

## Environment Variables

- Place API keys and other secrets in `~/.rumrunner`
- Set DEBUG=true to enable debug logging
- CLI automatically copies `~/.rumrunner` to `.env` in new projects
- Uses Bun's built-in environment variable support
- `.env` is automatically gitignored

Example ~/.rumrunner file:
```
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
DEBUG=true
```

## Cache File Structure
```json
{
  "hello:0": {
    "[\"World\"]": "Hello, World!"
  },
  "loadWebPage:1": {
    "[{\"url\":\"https://example.com\"}]": "<!DOCTYPE html>..."
  }
}
```
