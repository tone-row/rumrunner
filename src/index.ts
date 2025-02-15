export const VERSION = "0.1.0";

// New cache implementations - recommended
export type { ICache, CacheableFunction } from "./cache/base";
export { Cache } from "./cache/base";
export { SingleJsonCache } from "./cache/json-cache";
export { FileSQLiteCache } from "./cache/file-sqlite-cache";

/**
 * @deprecated Use SingleJsonCache or FileSQLiteCache instead. This function will be removed in a future version.
 * Example migration:
 * ```typescript
 * // Old usage:
 * import { cache } from 'rumrunner';
 * const cachedFn = cache("name:1", myFunction);
 *
 * // New usage with JSON file:
 * import { SingleJsonCache } from 'rumrunner';
 * const jsonCache = new SingleJsonCache();
 * const cachedFn = jsonCache.wrap("name:1", myFunction);
 *
 * // New usage with SQLite:
 * import { FileSQLiteCache } from 'rumrunner';
 * const sqliteCache = new FileSQLiteCache("./cache.db");
 * const cachedFn = sqliteCache.wrap("name:1", myFunction);
 * ```
 */
export { cache } from "./cache";
