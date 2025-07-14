#!/usr/bin/env bun
import { devServer } from "./dev-server";
import { rumrunnerServer, registerFunction } from "./rumrunnerServer";

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case "ui":
      console.log("Starting UI development server...");
      devServer(3000, 5173);
      break;

    case "server":
      console.log("Starting API server...");
      rumrunnerServer(3000);
      break;

    case "dev":
      console.log("Starting both API server and UI dev server...");
      // Start API server in background
      const apiServer = rumrunnerServer(3000);
      // Start UI dev server
      devServer(3000, 5173);
      break;

    default:
      console.log("RumRunner Development Commands:");
      console.log("  bun run rumrunner-dev server  - Start API server only");
      console.log("  bun run rumrunner-dev ui      - Start UI dev server only");
      console.log("  bun run rumrunner-dev dev     - Start both servers");
      console.log("");
      console.log("Or use npm scripts:");
      console.log(
        "  bun run dev                   - Start both with hot reload"
      );
      console.log(
        "  bun run ui:dev                - Start UI with Vite dev server"
      );
      console.log("  bun run server                - Start API server");
      break;
  }
}

main().catch(console.error);
