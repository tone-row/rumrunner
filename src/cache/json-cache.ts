import { join } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";
import type { CacheableFunction, ICache } from "./base";

type CacheData = { [key: string]: { [argsKey: string]: any } };

function debug(...args: any[]) {
  if (process.env.DEBUG === "true") {
    console.log("[DEBUG]", ...args);
  }
}

export class SingleJsonCache implements ICache {
  private cacheFilePath: string;

  constructor(cacheFilePath?: string) {
    this.cacheFilePath = cacheFilePath ?? join(process.cwd(), "cache.json");
  }

  private readCache(): CacheData {
    if (!existsSync(this.cacheFilePath)) {
      return {};
    }
    try {
      return JSON.parse(readFileSync(this.cacheFilePath, "utf-8"));
    } catch (e) {
      debug("Error reading cache:", e);
      return {};
    }
  }

  private writeCache(data: CacheData): void {
    try {
      writeFileSync(this.cacheFilePath, JSON.stringify(data, null, 2));
    } catch (e) {
      debug("Error writing cache:", e);
    }
  }

  private cleanupOldVersions(cacheData: CacheData, newCacheName: string): void {
    const [prefix] = newCacheName.split(":");
    const oldVersions = Object.keys(cacheData).filter(
      (key) => key.startsWith(prefix + ":") && key !== newCacheName
    );

    oldVersions.forEach((key) => {
      debug(`Cleaning up old cache version: ${key}`);
      delete cacheData[key];
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const cache = this.readCache();
    return (cache[key]?.value as T) ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const cache = this.readCache();
    cache[key] = { value };
    this.writeCache(cache);
  }

  async has(key: string): Promise<boolean> {
    const cache = this.readCache();
    return key in cache;
  }

  async delete(key: string): Promise<void> {
    const cache = this.readCache();
    delete cache[key];
    this.writeCache(cache);
  }

  async clear(): Promise<void> {
    this.writeCache({});
  }

  async getWithFallback<T, Args extends any[] = any[]>(
    key: string,
    fallback: CacheableFunction<T, Args>,
    options: { version?: string } = {}
  ): Promise<T> {
    const cacheKey = options.version ? `${key}:${options.version}` : key;

    if (!cacheKey.includes(":")) {
      throw new Error('Cache key must include a version, e.g. "myCache:0"');
    }

    const cache = this.readCache();

    if (cache[cacheKey]?.value !== undefined) {
      debug(`Cache hit for ${cacheKey}`);
      return cache[cacheKey].value as T;
    }

    debug(`Cache miss for ${cacheKey}`);
    const result = await Promise.resolve(fallback(...([] as unknown as Args)));

    cache[cacheKey] = { value: result };
    this.cleanupOldVersions(cache, cacheKey);
    this.writeCache(cache);

    return result;
  }

  wrap<T, Args extends any[]>(
    name: string,
    fn: CacheableFunction<T, Args>,
    version?: string
  ): CacheableFunction<T, Args> {
    const cacheKey = version ? `${name}:${version}` : name;

    if (!cacheKey.includes(":")) {
      throw new Error('Cache name must include a version, e.g. "myCache:0"');
    }

    return async (...args: Args): Promise<T> => {
      const cache = this.readCache();
      const argsKey = JSON.stringify(args);

      if (!cache[cacheKey]) {
        cache[cacheKey] = {};
        this.cleanupOldVersions(cache, cacheKey);
        this.writeCache(cache);
      }

      if (cache[cacheKey][argsKey] !== undefined) {
        debug(`Cache hit for ${cacheKey} with args:`, argsKey);
        return cache[cacheKey][argsKey] as T;
      }

      debug(`Cache miss for ${cacheKey} with args:`, argsKey);
      const result = await Promise.resolve(fn(...args));

      cache[cacheKey][argsKey] = result;
      this.writeCache(cache);

      return result;
    };
  }
}
