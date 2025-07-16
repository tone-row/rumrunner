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
  fn?: (...args: any[]) => Promise<any>; // The actual function implementation
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
    // Return functions without the fn property (which can't be serialized)
    const functionsForUI = registeredFunctions.map(({ fn, ...rest }) => rest);
    return c.json({ functions: functionsForUI });
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

  // API: Delete a specific job
  app.delete("/api/jobs/:id", async (c: Context) => {
    if (!globalCache) {
      return c.json({ error: "No cache instance set." }, 500);
    }

    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      return c.json({ error: "Invalid job ID" }, 400);
    }

    try {
      await globalCache.deleteJob(id);
      return c.json({
        success: true,
        message: `Job ${id} deleted successfully`,
      });
    } catch (error) {
      return c.json({ error: `Failed to delete job ${id}: ${error}` }, 500);
    }
  });

  // API: Delete jobs for a function and specific arguments
  app.delete("/api/jobs", async (c: Context) => {
    if (!globalCache) {
      return c.json({ error: "No cache instance set." }, 500);
    }

    const { functionName, args } = await c.req.json();
    if (!functionName) {
      return c.json({ error: "functionName is required" }, 400);
    }

    const key = functionName.includes(":") ? functionName : `${functionName}:0`;

    try {
      if (args) {
        await globalCache.deleteJobs(key, args);
        return c.json({
          success: true,
          message: `Jobs for ${functionName} with args ${JSON.stringify(
            args
          )} deleted successfully`,
        });
      } else {
        await globalCache.deleteAllJobs(key);
        return c.json({
          success: true,
          message: `All jobs for ${functionName} deleted successfully`,
        });
      }
    } catch (error) {
      return c.json(
        { error: `Failed to delete jobs for ${functionName}: ${error}` },
        500
      );
    }
  });

  // API: Requeue a job (delete and recreate)
  app.post("/api/jobs/requeue", async (c: Context) => {
    if (!globalCache) {
      return c.json({ error: "No cache instance set." }, 500);
    }

    const { functionName, args } = await c.req.json();
    if (!functionName || !args) {
      return c.json({ error: "functionName and args are required" }, 400);
    }

    const key = functionName.includes(":") ? functionName : `${functionName}:0`;

    try {
      await globalCache.requeueJob(key, args);
      return c.json({
        success: true,
        message: `Job for ${functionName} with args ${JSON.stringify(
          args
        )} requeued successfully`,
      });
    } catch (error) {
      return c.json(
        { error: `Failed to requeue job for ${functionName}: ${error}` },
        500
      );
    }
  });

  // API: Run a single job by ID
  app.post("/api/jobs/:id/run", async (c: Context) => {
    if (!globalCache) {
      return c.json({ error: "No cache instance set." }, 500);
    }

    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      return c.json({ error: "Invalid job ID" }, 400);
    }

    try {
      // Get all jobs to find the one with this ID
      const allJobs = [];
      for (const f of registeredFunctions) {
        const key = f.version ? `${f.name}:${f.version}` : f.name;
        const fnJobs = await globalCache.getAllJobs(key);
        allJobs.push(...fnJobs);
      }

      const job = allJobs.find((j: any) => j.id === id);

      if (!job) {
        return c.json({ error: `Job ${id} not found` }, 404);
      }

      // Extract function name from cache_key (e.g., "myFunction:1.0" -> "myFunction")
      const functionName = job.cache_key.split(":")[0];
      const func = registeredFunctions.find((f) => f.name === functionName);

      if (!func) {
        return c.json({ error: `Function ${functionName} not found` }, 404);
      }

      // Run the job using the cache's runJob method
      if (!func.fn) {
        return c.json(
          { error: `Function ${functionName} has no implementation stored` },
          400
        );
      }

      const result = await globalCache.runJob(id, func.fn);

      return c.json({
        success: true,
        message: `Job ${id} executed successfully`,
        result,
      });
    } catch (error) {
      return c.json({ error: `Failed to run job ${id}: ${error}` }, 500);
    }
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

  // Fallback for client-side routing - serve index.html for any non-API route
  app.get("*", async (c) => {
    // Skip API routes
    if (c.req.path.startsWith("/api/")) {
      return c.notFound();
    }
    // Serve index.html for all other routes to enable client-side routing
    return c.html(await Bun.file(join(uiDist, "index.html")).text());
  });

  // Start the server
  console.log(`🚀 Rumrunner server starting on port ${port}...`);
  Bun.serve({
    port,
    fetch: app.fetch,
  });
  console.log(`✅ Rumrunner server running at http://localhost:${port}`);
}
