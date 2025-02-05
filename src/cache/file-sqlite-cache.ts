import { Database } from "bun:sqlite";
import type { CacheableFunction, ICache } from "./base";

function debug(...args: any[]) {
  if (process.env.DEBUG === "true") {
    console.log("[DEBUG]", ...args);
  }
}

export class FileSQLiteCache implements ICache {
  private db: Database;
  private initialized: Promise<void>;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.initialized = this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    // Create a single table for all cache entries
    // - cache_key: combination of name and version (e.g., "myCache:1")
    // - args_key: stringified arguments
    // - value: stringified cached value
    // - created_at: timestamp for potential future TTL/cleanup features
    this.db.run(`
      CREATE TABLE IF NOT EXISTS cache_entries (
        cache_key TEXT NOT NULL,
        args_key TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (cache_key, args_key)
      )
    `);

    // Create an index for faster lookups and version cleanup
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_cache_key 
      ON cache_entries(cache_key)
    `);
  }

  private cleanupOldVersions(newCacheName: string): void {
    const [prefix] = newCacheName.split(":");
    if (!prefix) return;

    const stmt = this.db.prepare(
      `DELETE FROM cache_entries WHERE cache_key LIKE ? || ':%' AND cache_key != ?`
    );
    stmt.run(prefix, newCacheName);
  }

  async get<T>(key: string): Promise<T | null> {
    await this.initialized;
    const stmt = this.db.prepare(
      "SELECT value FROM cache_entries WHERE cache_key = ? AND args_key = '[]'"
    );
    const row = stmt.get(key) as { value: string } | null;

    if (!row) return null;
    return JSON.parse(row.value) as T;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.initialized;
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO cache_entries (cache_key, args_key, value, created_at)
      VALUES (?, '[]', ?, ?)
    `);
    stmt.run(key, JSON.stringify(value), Date.now());
  }

  async has(key: string): Promise<boolean> {
    await this.initialized;
    const stmt = this.db.prepare(
      "SELECT 1 FROM cache_entries WHERE cache_key = ? AND args_key = '[]'"
    );
    return stmt.get(key) !== null;
  }

  async delete(key: string): Promise<void> {
    await this.initialized;
    const stmt = this.db.prepare(
      "DELETE FROM cache_entries WHERE cache_key = ?"
    );
    stmt.run(key);
  }

  async clear(): Promise<void> {
    await this.initialized;
    this.db.run("DELETE FROM cache_entries");
  }

  async getWithFallback<T, Args extends any[] = any[]>(
    key: string,
    fallback: CacheableFunction<T, Args>,
    options: { version?: string } = {}
  ): Promise<T> {
    await this.initialized;
    const cacheKey = options.version ? `${key}:${options.version}` : key;

    if (!cacheKey.includes(":")) {
      throw new Error('Cache key must include a version, e.g. "myCache:0"');
    }

    const stmt = this.db.prepare(
      "SELECT value FROM cache_entries WHERE cache_key = ? AND args_key = '[]'"
    );
    const row = stmt.get(cacheKey) as { value: string } | null;

    if (row) {
      debug(`Cache hit for ${cacheKey}`);
      return JSON.parse(row.value) as T;
    }

    debug(`Cache miss for ${cacheKey}`);
    const result = await Promise.resolve(fallback(...([] as unknown as Args)));

    const insertStmt = this.db.prepare(`
      INSERT OR REPLACE INTO cache_entries (cache_key, args_key, value, created_at)
      VALUES (?, '[]', ?, ?)
    `);
    insertStmt.run(cacheKey, JSON.stringify(result), Date.now());
    this.cleanupOldVersions(cacheKey);

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
      await this.initialized;
      const argsKey = JSON.stringify(args);

      const stmt = this.db.prepare(
        "SELECT value FROM cache_entries WHERE cache_key = ? AND args_key = ?"
      );
      const row = stmt.get(cacheKey, argsKey) as { value: string } | null;

      if (row) {
        debug(`Cache hit for ${cacheKey} with args:`, argsKey);
        return JSON.parse(row.value) as T;
      }

      debug(`Cache miss for ${cacheKey} with args:`, argsKey);
      const result = await Promise.resolve(fn(...args));

      const insertStmt = this.db.prepare(`
        INSERT OR REPLACE INTO cache_entries (cache_key, args_key, value, created_at)
        VALUES (?, ?, ?, ?)
      `);
      insertStmt.run(cacheKey, argsKey, JSON.stringify(result), Date.now());
      this.cleanupOldVersions(cacheKey);

      return result;
    };
  }
}
