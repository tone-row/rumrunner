import type { Plugin } from "vite";
import { FileSQLiteCache } from "../cache/file-sqlite-cache";
import { existsSync } from "fs";
import { join } from "path";

export function rumrunnerPlugin(): Plugin {
  return {
    name: "vite-plugin-rumrunner",
    configureServer(server) {
      server.middlewares.use("/__rumrunner", async (req, res) => {
        const dbPath = join(process.cwd(), "cache.db");
        let data = {};
        if (existsSync(dbPath)) {
          const cache = new FileSQLiteCache(dbPath);
          data = await cache.getAllEntries();
        }
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(data));
      });
    },
  };
}
