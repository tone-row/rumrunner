import { Hono, type Context } from "hono";
import { serveStatic } from "hono/bun";
import { join, dirname } from "path";

// Types for registered functions and jobs
export type RegisteredFunction = {
  name: string;
  description?: string;
  params?: Record<string, any>;
  version?: string;
  processQueue?: () => Promise<void>;
};

// In-memory store for registered functions with their processQueue methods
const registeredFunctions: RegisteredFunction[] = [];

// Optionally, allow passing a cache instance for job listing
let globalCache: any = null;

export function registerFunction(fn: RegisteredFunction) {
  registeredFunctions.push(fn);
}

export function setCache(cache: any) {
  globalCache = cache;
}

export function rumrunnerServer(port: number = 3000) {
  console.log("Starting Rumrunner server...");

  const app = new Hono();

  // Healthcheck
  app.get("/healthz", (c: Context) =>
    c.json({ ok: true, message: "Rumrunner server healthy!" })
  );

  // API: List registered functions
  app.get("/api/functions", (c: Context) => {
    return c.json({ functions: registeredFunctions });
  });

  // API: List queued jobs (all or by function)
  app.get("/api/jobs", async (c: Context) => {
    if (!globalCache) {
      return c.json({ jobs: [], error: "No cache instance set." }, 500);
    }
    // Optionally filter by function name
    const fn = c.req.query("function");
    let jobs = [];
    if (fn) {
      // Get all jobs for a specific function (by cache key prefix)
      jobs = await globalCache.getAllJobs(fn);
    } else {
      // Get all jobs for all registered functions
      jobs = [];
      for (const f of registeredFunctions) {
        const key = f.version ? `${f.name}:${f.version}` : f.name;
        const fnJobs = await globalCache.getAllJobs(key);
        jobs.push(...fnJobs);
      }
    }
    return c.json({ jobs });
  });

  // API: Run jobs for a specific function
  app.post("/api/jobs/run", async (c: Context) => {
    const { functionName } = await c.req.json();

    if (!functionName) {
      return c.json({ error: "functionName is required" }, 400);
    }

    const func = registeredFunctions.find((f) => f.name === functionName);
    if (!func || !func.processQueue) {
      return c.json(
        {
          error: `Function ${functionName} not found or has no processQueue method`,
        },
        404
      );
    }

    try {
      await func.processQueue();
      return c.json({
        success: true,
        message: `Jobs for ${functionName} processed successfully`,
      });
    } catch (error) {
      return c.json(
        { error: `Failed to process jobs for ${functionName}: ${error}` },
        500
      );
    }
  });

  // API: Get job status (for polling)
  app.get("/api/jobs/status", async (c: Context) => {
    if (!globalCache) {
      return c.json({ jobs: [], error: "No cache instance set." }, 500);
    }

    const functionName = c.req.query("function");
    if (!functionName) {
      return c.json({ error: "function parameter is required" }, 400);
    }

    const key = functionName.includes(":") ? functionName : `${functionName}:1`; // Default version
    const jobs = await globalCache.getPendingJobs(key);

    return c.json({ jobs });
  });

  // Resolve absolute path to UI build output
  const uiDist = join(dirname(new URL(import.meta.url).pathname), "ui", "dist");

  // Serve static assets for UI at / and /ui
  app.use("/ui/*", serveStatic({ root: uiDist }));
  app.use(
    "/*",
    serveStatic({
      root: uiDist,
      rewriteRequestPath: (path) => (path === "/" ? "/index.html" : path),
    })
  );

  // Redirect /ui to /ui/index.html (for direct /ui route)
  app.get("/ui", (c) => c.redirect("/ui/index.html"));

  // Optionally, serve index.html for / (default UI)
  app.get("/", async (c) =>
    c.html(await Bun.file(join(uiDist, "index.html")).text())
  );

  // Start the server
  console.log(`🚀 Rumrunner server starting on port ${port}...`);
  Bun.serve({
    port,
    fetch: app.fetch,
  });
  console.log(`✅ Rumrunner server running at http://localhost:${port}`);
}
