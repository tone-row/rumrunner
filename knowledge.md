# Rumrunner Knowledge

## Core Value

Rumrunner is a toolkit for efficiently running, caching, and exploring function evaluations over large parameter spaces (cartesian products). It is designed to help users:
- Systematically explore function behavior across many input combinations
- Avoid redundant computation by caching results tied to input parameters
- Easily re-run or invalidate results when logic changes
- (Planned) Rank and qualify results, and explore them in a UI

## Cartesian Product Expansion

- Use the `product` utility to generate all combinations of named parameter sets
- Enables parameter sweeps and large-scale evaluation grids

## Function Caching

- Use `SingleJsonCache` (file-based) or `FileSQLiteCache` (SQLite-based) for caching function results
- Cache keys are based on function name, version, and stringified arguments
- Supports both sync and async functions
- Version-based cache invalidation: increment the version in your cache key to invalidate old results
- Automatically cleans up old cache versions
- Type-safe function wrapping for reliable usage

## Example Usage
```typescript
import { product, FileSQLiteCache } from "rumrunner";

const cache = new FileSQLiteCache("./cache.db");
const combos = product({ color: new Set(["red", "blue"]), size: new Set(["S", "M"]) });

async function expensiveEval({ color, size }: { color: string; size: string }) {
  // ...expensive computation...
  return `${color}-${size}`;
}

const cachedEval = cache.wrap<string, [{ color: string; size: string }]>(
  "eval:1",
  expensiveEval
);

for (const params of combos) {
  const result = await cachedEval(params);
  console.log(params, result);
}
```

## Planned Features

- Ranking and qualification of results (e.g., best/worst, pass/fail)
- UI for exploring, filtering, and re-running evaluations
- Manual cache-busting and control over which functions are re-run

## Environment Variables

- Set `DEBUG=true` to enable detailed cache logging
- `.env` is automatically gitignored

## Cache File Structure
```json
{
  "eval:1": {
    "[{\"color\":\"red\",\"size\":\"S\"}]": "red-S"
  }
}
```
