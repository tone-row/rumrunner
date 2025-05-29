#!/usr/bin/env bun
import { startDevServer } from "./dev-server";

startDevServer().catch((err) => {
  console.error("Failed to start Rumrunner dev server:", err);
  process.exit(1);
});
