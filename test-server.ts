import {
  FileSQLiteCache,
  product,
  rumrunnerServer,
  registerFunction,
  setCache,
} from "./src/index";

// Initialize Cache
const cache = new FileSQLiteCache("./cache.db");
setCache(cache);

// Example: Use product to generate parameter combinations
const names = new Set(["John", "Jane", "Jim", "Jill", "Jason", "Jenny"]);
const greetings = new Set(["Hello", "Hi", "Hey"]);
const combos = product({ name: names, greeting: greetings });

const cowSay = cache.wrapWithQueue("cowSay:0", async (name, greeting) => {
  // Simulate some work
  await new Promise((resolve) =>
    setTimeout(resolve, 1000 + Math.random() * 2000)
  );
  return `Cow: - ${greeting}, ${name}!`;
});

// Register the function with Rumrunner for discovery in the UI
registerFunction({
  name: "cowSay",
  description: "Greets a person with a cow.",
  params: { name: "string", greeting: "string" },
  version: "0",
  processQueue: () => cowSay.processQueue(),
  fn: async (name, greeting) => {
    // Simulate some work
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 2000)
    );
    return `Cow: - ${greeting}, ${name}!`;
  },
});

// Add another function for variety
const mathFunction = cache.wrapWithQueue(
  "mathFunction:0",
  async (a: number, b: number, operation: string) => {
    await new Promise((resolve) =>
      setTimeout(resolve, 500 + Math.random() * 1000)
    );
    switch (operation) {
      case "add":
        return a + b;
      case "multiply":
        return a * b;
      case "subtract":
        return a - b;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }
);

registerFunction({
  name: "mathFunction",
  description: "Performs basic math operations.",
  params: { a: "number", b: "number", operation: "string" },
  version: "0",
  processQueue: () => mathFunction.processQueue(),
  fn: async (a: number, b: number, operation: string) => {
    await new Promise((resolve) =>
      setTimeout(resolve, 500 + Math.random() * 1000)
    );
    switch (operation) {
      case "add":
        return a + b;
      case "multiply":
        return a * b;
      case "subtract":
        return a - b;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  },
});

(async () => {
  console.log("Setting up test jobs...");

  // Queue cow greeting jobs
  for (const combo of combos) {
    await cowSay.queue(combo.name, combo.greeting);
  }

  // Queue some math jobs
  const mathOperations = ["add", "multiply", "subtract"];
  for (let i = 1; i <= 5; i++) {
    for (const op of mathOperations) {
      await mathFunction.queue(i, i * 2, op);
    }
  }

  console.log("Jobs queued! Check the UI at http://localhost:3000");
  console.log(
    "You can now run jobs from the UI instead of automatically processing them."
  );
})();

rumrunnerServer();
