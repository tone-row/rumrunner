import { Hono, type Context } from "hono";
import { serveStatic } from "hono/bun";

export function rumrunnerServer() {
  const app = new Hono();
  app.get("/healthz", (c: Context) =>
    c.json({ ok: true, message: "Rumrunner server healthy!" })
  );
  app.get("/", (c: Context) =>
    c.text("Welcome to your Rumrunner-powered app!")
  );
  // Serve the Rumrunner UI static build at /ui and /ui/*
  app.use("/ui/*", serveStatic({ root: "src/ui/dist" }));
  // Redirect /ui to /ui/index.html
  app.get("/ui", (c) => c.redirect("/ui/index.html"));
  // TODO: Register your functions here with Rumrunner
  // TODO: Serve the Rumrunner UI here
  return app;
}
