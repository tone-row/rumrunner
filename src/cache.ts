import { join } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";

function debug(...args: any[]) {
  if (process.env.DEBUG === 'true') {
    console.log('[DEBUG]', ...args);
  }
}

type CacheableFunction<T> = (...args: any[]) => T | Promise<T>;
type CacheData = { [cacheName: string]: { [argsKey: string]: any } };

function getCacheFilePath() {
  return join(process.cwd(), 'cache.json');
}

function readCache(): CacheData {
  const path = getCacheFilePath();
  if (!existsSync(path)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch (e) {
    debug('Error reading cache:', e);
    return {};
  }
}

function writeCache(data: CacheData) {
  try {
    writeFileSync(getCacheFilePath(), JSON.stringify(data, null, 2));
  } catch (e) {
    debug('Error writing cache:', e);
  }
}

function cleanupOldVersions(cacheData: CacheData, newCacheName: string) {
  const [prefix] = newCacheName.split(':');
  const oldVersions = Object.keys(cacheData).filter(key => 
    key.startsWith(prefix + ':') && key !== newCacheName
  );
  
  oldVersions.forEach(key => {
    debug(`Cleaning up old cache version: ${key}`);
    delete cacheData[key];
  });
}

export function cache<T>(
  name: string,
  fn: CacheableFunction<T>
): CacheableFunction<T> {
  if (!name.includes(':')) {
    throw new Error('Cache name must include a colon, e.g. "myCache:0"');
  }

  return async (...args: Parameters<typeof fn>): Promise<T> => {
    const cacheData = readCache();
    const argsKey = JSON.stringify(args);
    
    // Initialize cache entry if needed
    if (!cacheData[name]) {
      cacheData[name] = {};
      // Clean up old versions when creating new cache entry
      cleanupOldVersions(cacheData, name);
      writeCache(cacheData);
    }

    // Check for cached value
    if (cacheData[name][argsKey] !== undefined) {
      debug(`Cache hit for ${name} with params:`, argsKey);
      return cacheData[name][argsKey];
    }
    
    debug(`Cache miss for ${name} with params:`, argsKey);
    const result = await Promise.resolve(fn(...args));
    
    // Update cache
    cacheData[name][argsKey] = result;
    writeCache(cacheData);
    
    return result;
  };
}
