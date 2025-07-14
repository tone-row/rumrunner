export const initialScript = `import { FileSQLiteCache, product, rumrunnerServer, registerFunction, setCache } from "rumrunner";
// import { chromium } from "@playwright/test";
// import { generateObject } from "ai";
// import { createOpenRouter } from "@openrouter/ai-sdk-provider";
// import { z } from "zod";
// import { createOllama } from 'ollama-ai-provider';

// const ollama = createOllama({
//   // optional settings, e.g.
//   baseURL: 'https://api.ollama.com',
// });

// Initialize Cache
const cache = new FileSQLiteCache("./cache.db");
setCache(cache); // <-- Make cache available to Rumrunner server for job listing

// Example: Use product to generate parameter combinations
const names = new Set(["John", "Jane", "Jim", "Jill", "Jason", "Jenny"]);
const greetings = new Set(["Hello", "Hi", "Hey"]);
const combos = product({ name: names, greeting: greetings });

const cowSay = cache.wrapWithQueue(
  "cowSay:0",
  async (name, greeting) => {
    return \`Cow: - \${greeting}, \${name}!\`;
  }
);

// Register the function with Rumrunner for discovery in the UI
registerFunction({
  name: "cowSay",
  description: "Greets a person with a cow.",
  params: { name: "string", greeting: "string" },
  version: "0",
  processQueue: () => cowSay.processQueue()
});

(async () => {
  // Queue all jobs
  for (const combo of combos) {
    await cowSay.queue(combo.name, combo.greeting);
  }

  // Process the queue (run all pending jobs)
  // await cowSay.processQueue(); // Commented out - let UI control execution

  // Optionally, call directly (bypasses queue)
  // const result = await cowSay.call("John", "Hello");
  // console.log(result);
})();

rumrunnerServer();

// --- Advanced: Scraping and LLM (uncomment to use) ---
// const openrouter = createOpenRouter({
//   apiKey: process.env.OPENROUTER_API_KEY,
// });

// const loadHTML = cache.wrapWithQueue("loadHTML:0", async (url) => {
//   const browser = await chromium.launch();
//   const page = await browser.newPage();
//   await page.goto(url);
//   const html = await page.content();
//   await browser.close();
//   return html;
// });

// const getPageTitle = cache.wrapWithQueue("getPageTitle:0", async (html) => {
//   const { object } = await generateObject({
//     model: openrouter("claude-3-5-sonnet-latest"),
//     schema: z.object({
//       title: z.string(),
//     }),
//     messages: [
//       {
//         role: "user",
//         content: \`Extract the title of the page from the following HTML: \${html}\`,
//       },
//     ],
//   });
//   return object.title;
// });

// await loadHTML.queue("https://google.com");
// await loadHTML.processQueue();
// await getPageTitle.queue("<html>...</html>");
// await getPageTitle.processQueue();
// console.log(await getPageTitle.call("<html>...</html>"));
`;
