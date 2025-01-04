#!/usr/bin/env bun
import tempDir from "temp-dir";
import { join } from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { initialScript } from "./helpers";

// Required packages for every project
const REQUIRED_PACKAGES = [
  "@playwright/test",
  "@types/bun",
  "typescript",
  "ai",
  "zod",
  "@ai-sdk/anthropic",
  "@ai-sdk/openai",
];

async function checkPlaywright() {
  try {
    const result = await Bun.spawn(["which", "playwright"], {
      stdout: "pipe",
    });

    const output = await new Response(result.stdout).text();
    console.log("Found Playwright at:", output.trim());
    return true;
  } catch (error) {
    console.log("Playwright not found globally");
    return false;
  }
}

// Create unique temp directory name
const uniqueTempDir = join(tempDir, `rumrunner-${Date.now()}`);
console.log("Created temp directory:", uniqueTempDir);

// Create package.json
const packageJson = {
  name: "rumrunner-app",
  version: "1.0.0",
  dependencies: {
    rumrunner: "link:rumrunner",
  },
};

// Write package.json to temp directory
await Bun.write(
  join(uniqueTempDir, "package.json"),
  JSON.stringify(packageJson, null, 2)
);

// Create tsconfig.json with decorator support
const tsConfig = {
  compilerOptions: {
    target: "ESNext",
    module: "ESNext",
    moduleResolution: "bundler",
    types: ["bun-types"],
    allowJs: true,
    strict: true,
    noEmit: true,
    experimentalDecorators: true,
    skipLibCheck: true,
  },
};

await Bun.write(
  join(uniqueTempDir, "tsconfig.json"),
  JSON.stringify(tsConfig, null, 2)
);

// Create empty cache.json
await Bun.write(join(uniqueTempDir, "cache.json"), JSON.stringify({}, null, 2));

// Copy .rumrunner from home directory to .env if it exists
const rumrunnerPath = join(homedir(), ".rumrunner");
if (existsSync(rumrunnerPath)) {
  try {
    const envContent = readFileSync(rumrunnerPath, "utf-8");
    await Bun.write(join(uniqueTempDir, ".env"), envContent);
    console.log("Copied .rumrunner configuration to .env");
  } catch (error) {
    console.error("Error copying .rumrunner configuration:", error);
  }
}

// Create index.ts with sample comment
await Bun.write(join(uniqueTempDir, "index.ts"), initialScript);

// Install required packages
const installCommand = ["bun", "install", ...REQUIRED_PACKAGES];
const installResult = await Bun.spawn(installCommand, {
  stdout: "inherit",
  stderr: "inherit",
  cwd: uniqueTempDir,
});

// Main CLI execution
const hasPlaywright = await checkPlaywright();
console.log("Has global Playwright installation:", hasPlaywright);

// Open VS Code and change directory
try {
  // Change to the new directory first
  process.chdir(uniqueTempDir);
  console.log(`\nChanged directory to: ${uniqueTempDir}`);
  
  // Open VS Code (or Cursor if aliased)
  await Bun.spawn(["code", "index.ts"], {
    stdout: "inherit",
    stderr: "inherit"
  });

  // Print helpful next steps
  console.log(`
🎉 Setup complete! Your new rumrunner project is ready.

To get started, run:
  bun run --watch index.ts

The index.ts file has been opened in your editor.
Remember to check the DEBUG environment variable in ~/.rumrunner if you need more detailed logging.
`);

} catch (error) {
  console.error("Error setting up workspace:", error);
}
