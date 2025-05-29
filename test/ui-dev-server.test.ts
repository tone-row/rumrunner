import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { spawn } from "child_process";

let serverProcess: any;
const PORT = 5173; // default Vite port

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollEndpoint(url: string, timeoutMs = 15000, intervalMs = 500) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status === 200) return res;
    } catch (e) {
      // ignore
    }
    await wait(intervalMs);
  }
  throw new Error(`Timeout waiting for ${url}`);
}

describe("rumrunner dev server", () => {
  beforeAll(async () => {
    serverProcess = spawn("bun", ["run", "src/bin.ts", "dev"], {
      env: { ...process.env, PORT: String(PORT) },
      stdio: "inherit",
    });
    // Wait for server to start (poll endpoint)
    await pollEndpoint(`http://localhost:${PORT}/__rumrunner`);
  });

  afterAll(() => {
    if (serverProcess) serverProcess.kill();
  });

  test("/__rumrunner endpoint returns JSON", async () => {
    const res = await fetch(`http://localhost:${PORT}/__rumrunner`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(typeof data).toBe("object");
  });
});
