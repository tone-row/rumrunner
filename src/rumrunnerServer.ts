import { Hono, type Context } from "hono";
import { serveStatic } from "hono/bun";
import { join, dirname } from "path";

// Types for registered functions and jobs
export type RegisteredFunction = {
  name: string;
  description?: string;
  params?: Record<string, any>;
  version?: string;
};

// In-memory store for registered functions
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
      // Try to get jobs for a specific function (by cache key prefix)
      jobs = await globalCache.getPendingJobs(fn);
    } else {
      // Not efficient: for demo, get jobs for all registered functions
      jobs = [];
      for (const f of registeredFunctions) {
        const key = f.version ? `${f.name}:${f.version}` : f.name;
        const fnJobs = await globalCache.getPendingJobs(key);
        jobs.push(...fnJobs);
      }
    }
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
