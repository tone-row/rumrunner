import { spawn } from "child_process";

async function testAPI() {
  console.log("Testing API endpoints...");

  try {
    // Test functions endpoint
    const functionsRes = await fetch("http://localhost:3000/api/functions");
    const functions = await functionsRes.json();
    console.log("Functions API response:", functions);

    // Test jobs endpoint
    const jobsRes = await fetch("http://localhost:3000/api/jobs");
    const jobs = await jobsRes.json();
    console.log("Jobs API response:", jobs);
  } catch (error) {
    console.error("API test failed:", error);
  }
}

(async () => {
  console.log("Starting debug test...");

  // Start the server in a separate process
  console.log("Starting server in separate process...");
  const serverProcess = spawn("bun", ["run", "test-server.ts"], {
    stdio: "pipe",
    env: { ...process.env },
  });

  // Wait for server to start
  console.log("Waiting for server to start...");
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Test the API endpoints
  await testAPI();

  console.log("\nDebug test complete. Check http://localhost:3000 for the UI.");
  console.log("Server is still running. Press Ctrl+C to stop.");

  // Keep the server running for manual testing
  // Don't kill the server process - let it keep running
})();
