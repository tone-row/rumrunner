import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { spawnSync, spawn } from "child_process";

const CLI_PATH = join(__dirname, "../src/bin.ts");

function runCli(projectDir: string, projectName: string) {
  const result = spawnSync("bun", ["run", CLI_PATH, projectName], {
    cwd: projectDir,
    encoding: "utf-8",
    env: process.env,
  });
  return result;
}

describe("rumrunner CLI e2e", () => {
  let tempDir: string;
  let projectName = "rumrunner-e2e-test";
  let projectPath: string;
  let serverProcess: any;

  beforeAll(() => {
    tempDir = mkdtempSync(join(tmpdir(), "rumrunner-e2e-"));
    projectPath = join(tempDir, projectName);
  });

  afterAll(() => {
    if (serverProcess) {
      serverProcess.kill();
    }
    rmSync(tempDir, { recursive: true, force: true });
  });

  test("CLI scaffolds a new project with expected files and starter content", async () => {
    const result = runCli(tempDir, projectName);
    expect(result.status).toBe(0);
    expect(existsSync(join(projectPath, "index.ts"))).toBe(true);
    expect(existsSync(join(projectPath, "package.json"))).toBe(true);
    expect(existsSync(join(projectPath, "tsconfig.json"))).toBe(true);

    const indexContent = readFileSync(join(projectPath, "index.ts"), "utf-8");
    expect(indexContent).toContain("rumrunnerServer");
  });

  test("generated app runs a Hono server and responds to healthcheck", async () => {
    // Install dependencies
    const install = spawnSync("bun", ["install"], {
      cwd: projectPath,
      encoding: "utf-8",
      env: process.env,
    });
    expect(install.status).toBe(0);

    // Start the server in the background
    serverProcess = spawn("bun", ["run", "index.ts"], {
      cwd: projectPath,
      env: process.env,
      stdio: "ignore",
    });

    // Wait for the server to start
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Make a request to the healthcheck endpoint
    const res = await fetch("http://localhost:3000/healthz");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.message).toContain("Rumrunner server healthy");
  });
});
