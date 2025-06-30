export const VERSION = "0.1.0";

// New cache implementations - recommended
export type { ICache, CacheableFunction } from "./cache/base";
export { Cache } from "./cache/base";
export { SingleJsonCache } from "./cache/json-cache";
export { FileSQLiteCache } from "./cache/file-sqlite-cache";
export { product } from "./product";
export { rumrunnerServer, registerFunction, setCache } from "./rumrunnerServer";
