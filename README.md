# rumrunner

A TypeScript toolkit for running, caching, and exploring function evaluations over large parameter spaces.

## Value Proposition

Rumrunner empowers users to efficiently run, cache, and analyze the results of functions evaluated over many combinations of parameters (cartesian products). It is designed for workflows where you want to:
- Systematically explore the behavior of a function across a wide range of inputs
- Avoid redundant computation by caching results tied to input parameters
- Easily re-run or invalidate results when logic changes
- (Planned) Rank and qualify results, and explore them in a UI

## Features

- 🧮 Cartesian product expansion for parameter sweeps
- 💾 Multiple caching backends (JSON and SQLite) for function results
- 🔄 Version-based cache invalidation
- 🎯 Type-safe function wrapping and caching
- (Planned) Ranking and qualification of results
- (Planned) UI for exploring and controlling evaluations

## Installation

```bash
bun install -g rumrunner
```

## Cartesian Product Expansion

Generate all combinations of named parameter sets:

```typescript
import { product } from "rumrunner";

const color = new Set(["red", "blue"]);
const size = new Set(["S", "M"]);
const combos = product({ color, size });
// combos: [
//   { color: "red", size: "S" },
//   { color: "red", size: "M" },
//   { color: "blue", size: "S" },
//   { color: "blue", size: "M" },
// ]
```

## Function Caching

Cache the results of expensive or repeated function calls, keyed by input parameters and version:

```typescript
import { SingleJsonCache, FileSQLiteCache } from "rumrunner";

const cache = new FileSQLiteCache("./cache.db"); // or SingleJsonCache

async function expensiveEval(params: { color: string; size: string }) {
  // ...expensive computation...
  return `${params.color}-${params.size}`;
}

const cachedEval = cache.wrap<string, [{ color: string; size: string }]>(
  "eval:1",
  expensiveEval
);

const result = await cachedEval({ color: "red", size: "S" }); // Cache miss
const result2 = await cachedEval({ color: "red", size: "S" }); // Cache hit
```

## Evaluating Over Parameter Grids

Combine cartesian product and caching to run a function over all parameter combinations, caching each result:

```typescript
import { product, FileSQLiteCache } from "rumrunner";

const cache = new FileSQLiteCache("./cache.db");
const colors = new Set(["red", "blue"]);
const sizes = new Set(["S", "M"]);
const combos = product({ color: colors, size: sizes });

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

## Version-based Cache Invalidation

Increment the version in your cache key to invalidate old results automatically:

```typescript
const v1 = cache.wrap("eval:1", expensiveEval);
const v2 = cache.wrap("eval:2", expensiveEval); // Old results are cleaned up
```

## Planned Features

- Ranking and qualification of results (e.g., best/worst, pass/fail)
- UI for exploring, filtering, and re-running evaluations
- Manual cache-busting and control over which functions are re-run

## Project Structure

```
your-project/
├── cache.json        # JSON cache storage (if using SingleJsonCache)
├── cache.db         # SQLite cache storage (if using FileSQLiteCache)
├── index.ts         # Your main script
├── package.json     # Project dependencies
└── tsconfig.json    # TypeScript configuration
```

## Dependencies

- Bun runtime
- TypeScript

## License

MIT
