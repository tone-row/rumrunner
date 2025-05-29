import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { spawnSync } from "child_process";

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

  beforeAll(() => {
    tempDir = mkdtempSync(join(tmpdir(), "rumrunner-e2e-"));
    projectPath = join(tempDir, projectName);
  });

  afterAll(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  test("CLI scaffolds a new project with expected files and starter content", () => {
    const result = runCli(tempDir, projectName);
    expect(result.status).toBe(0);
    expect(existsSync(join(projectPath, "index.ts"))).toBe(true);
    expect(existsSync(join(projectPath, "package.json"))).toBe(true);
    expect(existsSync(join(projectPath, "tsconfig.json"))).toBe(true);

    const indexContent = readFileSync(join(projectPath, "index.ts"), "utf-8");
    expect(indexContent).toContain("product");
    expect(indexContent).toContain("cowSay");
    expect(indexContent).toContain("// import { chromium");
    expect(indexContent).toContain("// const loadHTML");
    expect(indexContent).toContain("// const getPageTitle");
  });

  test("starter script runs and prints expected cowSay output", () => {
    // Install dependencies (skip if already installed)
    const install = spawnSync("bun", ["install"], {
      cwd: projectPath,
      encoding: "utf-8",
      env: process.env,
    });
    expect(install.status).toBe(0);

    // Run the starter script
    const run = spawnSync("bun", ["run", "index.ts"], {
      cwd: projectPath,
      encoding: "utf-8",
      env: process.env,
    });
    expect(run.status).toBe(0);
    // Check for all name/greeting combos
    const expectedNames = ["John", "Jane", "Jim", "Jill", "Jason", "Jenny"];
    const expectedGreetings = ["Hello", "Hi", "Hey"];
    for (const name of expectedNames) {
      for (const greeting of expectedGreetings) {
        expect(run.stdout).toContain(`🐄 – ${greeting}, ${name}!`);
      }
    }
  });
});
