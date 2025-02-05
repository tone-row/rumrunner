import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { SingleJsonCache } from "../src/cache/json-cache";
import { join } from "path";
import { unlinkSync, existsSync } from "fs";

const TEST_CACHE_PATH = join(process.cwd(), "test-cache.json");

describe("SingleJsonCache", () => {
  let cache: SingleJsonCache;

  beforeEach(() => {
    cache = new SingleJsonCache(TEST_CACHE_PATH);
  });

  afterEach(() => {
    if (existsSync(TEST_CACHE_PATH)) {
      unlinkSync(TEST_CACHE_PATH);
    }
  });

  test("basic set and get operations", async () => {
    await cache.set<string>("test:1", "hello");
    expect(await cache.get<string>("test:1")).toBe("hello");
  });

  test("returns null for missing keys", async () => {
    expect(await cache.get<string>("missing:1")).toBeNull();
  });

  test("has returns correct boolean", async () => {
    await cache.set<string>("exists:1", "value");
    expect(await cache.has("exists:1")).toBe(true);
    expect(await cache.has("missing:1")).toBe(false);
  });

  test("delete removes key", async () => {
    await cache.set<string>("delete:1", "value");
    expect(await cache.has("delete:1")).toBe(true);
    await cache.delete("delete:1");
    expect(await cache.has("delete:1")).toBe(false);
  });

  test("clear removes all keys", async () => {
    await cache.set<string>("key1:1", "value1");
    await cache.set<string>("key2:1", "value2");
    await cache.clear();
    expect(await cache.has("key1:1")).toBe(false);
    expect(await cache.has("key2:1")).toBe(false);
  });

  test("getWithFallback caches and returns fallback value", async () => {
    let callCount = 0;
    const fallback = () => {
      callCount++;
      return "fallback value";
    };

    const result1 = await cache.getWithFallback<string>("fallback:1", fallback);
    expect(result1).toBe("fallback value");
    expect(callCount).toBe(1);

    const result2 = await cache.getWithFallback<string>("fallback:1", fallback);
    expect(result2).toBe("fallback value");
    expect(callCount).toBe(1); // Should not have called fallback again
  });

  test("getWithFallback cleans up old versions", async () => {
    await cache.set<string>("test:1", "old version");
    const result = await cache.getWithFallback<string>(
      "test:2",
      () => "new version"
    );

    expect(result).toBe("new version");
    expect(await cache.has("test:1")).toBe(false);
    expect(await cache.get<string>("test:2")).toBe("new version");
  });

  test("getWithFallback requires versioned key", async () => {
    await expect(
      cache.getWithFallback<string>("invalid-key", () => "value")
    ).rejects.toThrow("Cache key must include a version");
  });

  test("wrap preserves function types and arguments", async () => {
    // Define a function with specific parameter types
    async function greet(name: string, age: number): Promise<string> {
      return `Hello ${name}, you are ${age} years old`;
    }

    // Wrap the function
    const cachedGreet = cache.wrap<string, [string, number]>("greet:1", greet);

    // Test with correct parameter types
    const result1 = await cachedGreet("Alice", 30);
    expect(result1).toBe("Hello Alice, you are 30 years old");

    // Test cache hit with same parameters
    const result2 = await cachedGreet("Alice", 30);
    expect(result2).toBe("Hello Alice, you are 30 years old");

    // Test different parameters
    const result3 = await cachedGreet("Bob", 25);
    expect(result3).toBe("Hello Bob, you are 25 years old");

    // @ts-expect-error - This should fail type checking
    cachedGreet("Alice", "30");

    // @ts-expect-error - This should fail type checking
    cachedGreet("Alice");
  });

  test("wrap handles complex return types", async () => {
    interface User {
      id: number;
      name: string;
    }

    async function getUser(id: number): Promise<User> {
      return { id, name: `User ${id}` };
    }

    const cachedGetUser = cache.wrap<User, [number]>("user:1", getUser);

    const result1 = await cachedGetUser(1);
    expect(result1).toEqual({ id: 1, name: "User 1" });

    const result2 = await cachedGetUser(1);
    expect(result2).toEqual({ id: 1, name: "User 1" });
  });
});
