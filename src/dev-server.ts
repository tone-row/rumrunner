import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { join, dirname } from "path";

export function devServer(apiPort: number = 3000, uiPort: number = 5173) {
  console.log("Starting Rumrunner development server...");

  const app = new Hono();

  // Proxy API calls to the main server
  app.use("/api/*", async (c) => {
    const url = new URL(c.req.url);
    const apiUrl = `http://localhost:${apiPort}${url.pathname}${url.search}`;

    try {
      const response = await fetch(apiUrl, {
        method: c.req.method,
        headers: c.req.header(),
        body: c.req.raw.body,
      });

      return new Response(response.body, {
        status: response.status,
        headers: response.headers,
      });
    } catch (error) {
      console.error("API proxy error:", error);
      return c.json({ error: "API server not available" }, 503);
    }
  });

  // Serve static assets for development
  const uiDist = join(dirname(new URL(import.meta.url).pathname), "ui", "dist");

  app.use(
    "/*",
    serveStatic({
      root: uiDist,
      rewriteRequestPath: (path) => (path === "/" ? "/index.html" : path),
    })
  );

  // Start the development server
  console.log(`🚀 Rumrunner dev server starting on port ${uiPort}...`);
  console.log(`📡 Proxying API calls to http://localhost:${apiPort}`);
  console.log(`🌐 UI available at http://localhost:${uiPort}`);

  Bun.serve({
    port: uiPort,
    fetch: app.fetch,
  });

  console.log(`✅ Rumrunner dev server running at http://localhost:${uiPort}`);
}
