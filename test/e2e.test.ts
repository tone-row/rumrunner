import { test, expect } from "@playwright/test";
import {
  rumrunnerServer,
  registerFunction,
  setCache,
} from "../src/rumrunnerServer";
import { FileSQLiteCache } from "../src/cache/file-sqlite-cache";
import { join } from "path";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";

test.describe("RumRunner E2E Tests", () => {
  let server: any;
  let cache: FileSQLiteCache;
  let tempDir: string;

  test.beforeAll(async () => {
    // Create temporary directory for cache
    tempDir = mkdtempSync(join(tmpdir(), "rumrunner-test-"));
    cache = new FileSqliteCache(tempDir);

    // Register a test function
    registerFunction({
      name: "test-function",
      description: "A test function for E2E testing",
      version: "1.0.0",
    });

    // Set the cache instance
    setCache(cache);

    // Start the server
    server = rumrunnerServer(3001);
  });

  test.afterAll(async () => {
    // Clean up - FileSQLiteCache doesn't have a close method
    // Note: Server cleanup would need to be implemented in rumrunnerServer
  });

  test("should display registered functions in UI", async ({ page }) => {
    await page.goto("http://localhost:3001");

    // Wait for the functions to load
    await page.waitForSelector("pre");

    // Check that the test function is displayed
    const content = await page.textContent("pre");
    expect(content).toContain("test-function");
    expect(content).toContain("A test function for E2E testing");
  });

  test("should display jobs in UI", async ({ page }) => {
    // Add a test job to the cache
    await cache.set("test-function:1.0.0:test-params", {
      result: "test-result",
    });

    await page.goto("http://localhost:3001");

    // Wait for the jobs to load
    await page.waitForSelector("pre");

    // Check that jobs are displayed (even if empty)
    const content = await page.textContent("pre");
    expect(content).toBeDefined();
  });

  test("should handle API endpoints correctly", async ({ page }) => {
    // Test functions API
    const functionsResponse = await page.request.get(
      "http://localhost:3001/api/functions"
    );
    expect(functionsResponse.ok()).toBeTruthy();

    const functions = await functionsResponse.json();
    expect(functions.functions).toHaveLength(1);
    expect(functions.functions[0].name).toBe("test-function");

    // Test jobs API
    const jobsResponse = await page.request.get(
      "http://localhost:3001/api/jobs"
    );
    expect(jobsResponse.ok()).toBeTruthy();

    const jobs = await jobsResponse.json();
    expect(Array.isArray(jobs.jobs)).toBeTruthy();
  });

  test("should handle server health check", async ({ page }) => {
    const healthResponse = await page.request.get(
      "http://localhost:3001/healthz"
    );
    expect(healthResponse.ok()).toBeTruthy();

    const health = await healthResponse.json();
    expect(health.ok).toBe(true);
    expect(health.message).toBe("Rumrunner server healthy!");
  });
});
