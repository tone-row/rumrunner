import {
  FileSQLiteCache,
  product,
  rumrunnerServer,
  registerFunction,
  setCache,
} from "rumrunner";

// Initialize Cache
const cache = new FileSQLiteCache("./cache.db");
setCache(cache); // <-- Make cache available to Rumrunner server for job listing

// Example: Use product to generate parameter combinations
const names = new Set(["John", "Jane", "Jim"]);
const greetings = new Set(["Hello", "Hi"]);
const combos = product({ name: names, greeting: greetings });

const cowSay = cache.wrapWithQueue("cowSay:0", async (name, greeting) => {
  return `Cow: - ${greeting}, ${name}!`;
});

// Register the function with Rumrunner for discovery in the UI
registerFunction({
  name: "cowSay",
  description: "Greets a person with a cow.",
  params: { name: "string", greeting: "string" },
  version: "0",
});

(async () => {
  console.log("Starting test server...");

  // Queue all jobs
  console.log("Queuing jobs...");
  for (const combo of combos) {
    await cowSay.queue(combo.name, combo.greeting);
    console.log(`Queued: ${combo.name}, ${combo.greeting}`);
  }

  // Start the server
  rumrunnerServer();
})();
