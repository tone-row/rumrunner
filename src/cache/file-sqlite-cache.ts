import { Database } from "bun:sqlite";
import type { CacheableFunction, ICache } from "./base";

function debug(...args: any[]) {
  if (process.env.DEBUG === "true") {
    console.log("[DEBUG]", ...args);
  }
}

export type JobStatus = "pending" | "complete" | "error";

export interface QueueEntry<Args extends any[] = any[], T = any> {
  id: number;
  cache_key: string;
  args_key: string;
  args: Args;
  status: JobStatus;
  result?: T;
  error?: string;
  created_at: number;
  updated_at: number;
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

    // Add a table for queued jobs
    this.db.run(`
      CREATE TABLE IF NOT EXISTS queue_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cache_key TEXT NOT NULL,
        args_key TEXT NOT NULL,
        status TEXT NOT NULL,
        result TEXT,
        error TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
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

  async getAllEntries(): Promise<
    Record<string, Array<{ args: any; value: any; created_at: number }>>
  > {
    await this.initialized;
    const stmt = this.db.prepare(
      "SELECT cache_key, args_key, value, created_at FROM cache_entries"
    );
    const rows = stmt.all() as Array<{
      cache_key: string;
      args_key: string;
      value: string;
      created_at: number;
    }>;
    const result: Record<
      string,
      Array<{ args: any; value: any; created_at: number }>
    > = {};
    for (const row of rows) {
      if (!result[row.cache_key]) result[row.cache_key] = [];
      result[row.cache_key].push({
        args: JSON.parse(row.args_key),
        value: JSON.parse(row.value),
        created_at: row.created_at,
      });
    }
    return result;
  }

  /**
   * Queue a job for later execution
   */
  async queueJob<Args extends any[]>(
    cacheKey: string,
    args: Args
  ): Promise<void> {
    await this.initialized;
    const argsKey = JSON.stringify(args);

    // Check if a job with the same cache_key and args_key already exists
    const existingStmt = this.db.prepare(
      `SELECT id FROM queue_entries WHERE cache_key = ? AND args_key = ?`
    );
    const existing = existingStmt.get(cacheKey, argsKey) as {
      id: number;
    } | null;

    if (existing) {
      debug(
        `Job already exists for ${cacheKey} with args: ${argsKey}, skipping`
      );
      return;
    }

    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO queue_entries (cache_key, args_key, status, created_at, updated_at)
      VALUES (?, ?, 'pending', ?, ?)
    `);
    stmt.run(cacheKey, argsKey, now, now);
    debug(`Queued new job for ${cacheKey} with args: ${argsKey}`);
  }

  /**
   * Get all pending jobs for a cacheKey
   */
  async getPendingJobs<Args extends any[]>(
    cacheKey: string
  ): Promise<QueueEntry<Args>[]> {
    await this.initialized;
    const stmt = this.db.prepare(
      `SELECT * FROM queue_entries WHERE cache_key = ? AND status = 'pending'`
    );
    const rows = stmt.all(cacheKey) as QueueEntry<Args>[];
    return rows.map((row) => ({
      ...row,
      args: JSON.parse(row.args_key),
      result: row.result ? JSON.parse(row.result) : undefined,
    }));
  }

  /**
   * Update a job with result or error
   */
  async updateJobResult<T>(
    id: number,
    result: T,
    error?: string
  ): Promise<void> {
    await this.initialized;
    const status = error ? "error" : "complete";
    const now = Date.now();
    const stmt = this.db.prepare(`
      UPDATE queue_entries SET status = ?, result = ?, error = ?, updated_at = ? WHERE id = ?
    `);
    stmt.run(
      status,
      result ? JSON.stringify(result) : null,
      error ?? null,
      now,
      id
    );
  }

  /**
   * Run a single job by ID
   */
  async runJob<T, Args extends any[]>(
    id: number,
    fn: CacheableFunction<T, Args>
  ): Promise<T> {
    await this.initialized;

    // Get the job details
    const stmt = this.db.prepare(`SELECT * FROM queue_entries WHERE id = ?`);
    const job = stmt.get(id) as QueueEntry<Args> | null;

    if (!job) {
      throw new Error(`Job with ID ${id} not found`);
    }

    if (job.status !== "pending") {
      throw new Error(`Job ${id} is not pending (status: ${job.status})`);
    }

    try {
      const args = JSON.parse(job.args_key);
      const result = await fn(...args);

      // Update the job with the result
      await this.updateJobResult(id, result);

      // Also cache the result for normal cache lookup
      const cacheKey = job.cache_key;
      await this.set(`${cacheKey}:${job.args_key}`, result);

      return result;
    } catch (e: any) {
      await this.updateJobResult(id, undefined, String(e));
      throw e;
    }
  }

  /**
   * Get all jobs for a cacheKey (any status)
   */
  async getAllJobs<Args extends any[]>(
    cacheKey: string
  ): Promise<QueueEntry<Args>[]> {
    await this.initialized;
    const stmt = this.db.prepare(
      `SELECT * FROM queue_entries WHERE cache_key = ? ORDER BY created_at ASC`
    );
    const rows = stmt.all(cacheKey) as QueueEntry<Args>[];
    return rows.map((row) => ({
      ...row,
      args: JSON.parse(row.args_key),
      result: row.result ? JSON.parse(row.result) : undefined,
    }));
  }

  /**
   * Delete a specific job by ID
   */
  async deleteJob(id: number): Promise<void> {
    await this.initialized;
    const stmt = this.db.prepare(`DELETE FROM queue_entries WHERE id = ?`);
    stmt.run(id);
    debug(`Deleted job ${id}`);
  }

  /**
   * Delete all jobs for a cacheKey and args combination
   */
  async deleteJobs<Args extends any[]>(
    cacheKey: string,
    args: Args
  ): Promise<void> {
    await this.initialized;
    const argsKey = JSON.stringify(args);
    const stmt = this.db.prepare(
      `DELETE FROM queue_entries WHERE cache_key = ? AND args_key = ?`
    );
    stmt.run(cacheKey, argsKey);
    debug(`Deleted jobs for ${cacheKey} with args: ${argsKey}`);
  }

  /**
   * Delete all jobs for a cacheKey
   */
  async deleteAllJobs(cacheKey: string): Promise<void> {
    await this.initialized;
    const stmt = this.db.prepare(
      `DELETE FROM queue_entries WHERE cache_key = ?`
    );
    stmt.run(cacheKey);
    debug(`Deleted all jobs for ${cacheKey}`);
  }

  /**
   * Force requeue a job (delete existing and create new)
   */
  async requeueJob<Args extends any[]>(
    cacheKey: string,
    args: Args
  ): Promise<void> {
    await this.initialized;
    await this.deleteJobs(cacheKey, args);
    await this.queueJob(cacheKey, args);
    debug(`Requeued job for ${cacheKey} with args: ${JSON.stringify(args)}`);
  }

  /**
   * Wrap a function to provide call, queue, and processQueue methods
   */
  wrapWithQueue<T, Args extends any[]>(
    name: string,
    fn: CacheableFunction<T, Args>,
    version?: string
  ): {
    call: (...args: Args) => Promise<T>;
    queue: (...args: Args) => Promise<void>;
    requeue: (...args: Args) => Promise<void>;
    processQueue: () => Promise<void>;
    runJob: (id: number) => Promise<T>;
    deleteJob: (id: number) => Promise<void>;
    deleteJobs: (args: Args) => Promise<void>;
    deleteAllJobs: () => Promise<void>;
  } {
    const cacheKey = version ? `${name}:${version}` : name;
    if (!cacheKey.includes(":")) {
      throw new Error('Cache name must include a version, e.g. "myCache:0"');
    }
    const call = async (...args: Args): Promise<T> => {
      return await this.wrap<T, Args>(name, fn, version)(...args);
    };
    const queue = async (...args: Args) => {
      await this.queueJob(cacheKey, args);
    };
    const requeue = async (...args: Args) => {
      await this.requeueJob(cacheKey, args);
    };
    const processQueue = async () => {
      const jobs = await this.getPendingJobs<Args>(cacheKey);
      for (const job of jobs) {
        try {
          const result = await fn(...job.args);
          // Update both the queue entry and the cache
          await this.updateJobResult(job.id, result);
          // Also cache the result for normal cache lookup
          await this.set(`${cacheKey}:${job.args_key}`, result);
        } catch (e: any) {
          await this.updateJobResult(job.id, undefined, String(e));
        }
      }
    };
    const deleteJob = async (id: number) => {
      await this.deleteJob(id);
    };
    const deleteJobs = async (args: Args) => {
      await this.deleteJobs(cacheKey, args);
    };
    const deleteAllJobs = async () => {
      await this.deleteAllJobs(cacheKey);
    };
    const runJob = async (id: number): Promise<T> => {
      return await this.runJob<T, Args>(id, fn);
    };
    return {
      call,
      queue,
      requeue,
      processQueue,
      runJob,
      deleteJob,
      deleteJobs,
      deleteAllJobs,
    };
  }
}
