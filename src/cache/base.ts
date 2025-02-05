export type CacheableFunction<T, Args extends any[] = any[]> = (
  ...args: Args
) => T | Promise<T>;

export interface ICache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;

  getWithFallback<T, Args extends any[] = any[]>(
    key: string,
    fallback: CacheableFunction<T, Args>,
    options?: { version?: string }
  ): Promise<T>;

  wrap<T, Args extends any[]>(
    name: string,
    fn: CacheableFunction<T, Args>,
    version?: string
  ): CacheableFunction<T, Args>;
}

export abstract class Cache implements ICache {
  abstract get<T>(key: string): Promise<T | null>;
  abstract set<T>(key: string, value: T): Promise<void>;
  abstract has(key: string): Promise<boolean>;
  abstract delete(key: string): Promise<void>;
  abstract clear(): Promise<void>;

  abstract getWithFallback<T, Args extends any[] = any[]>(
    key: string,
    fallback: CacheableFunction<T, Args>,
    options?: { version?: string }
  ): Promise<T>;

  abstract wrap<T, Args extends any[]>(
    name: string,
    fn: CacheableFunction<T, Args>,
    version?: string
  ): CacheableFunction<T, Args>;
}
