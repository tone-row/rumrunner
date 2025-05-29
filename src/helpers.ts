export const initialScript = `import { FileSQLiteCache, product } from "rumrunner";
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

// Example: Use product to generate parameter combinations
const names = new Set(["John", "Jane", "Jim", "Jill", "Jason", "Jenny"]);
const greetings = new Set(["Hello", "Hi", "Hey"]);
const combos = product({ name: names, greeting: greetings });

const cowSay = cache.wrap("cowSay:0", async (name, greeting) => {
  return \`Cow: - \${greeting}, \${name}!\`;
});

(async () => {
  for (const { name, greeting } of combos) {
    const cow = await cowSay(name, greeting);
    console.log(cow);
  }
})();

// --- Advanced: Scraping and LLM (uncomment to use) ---
// const openrouter = createOpenRouter({
//   apiKey: process.env.OPENROUTER_API_KEY,
// });

// const loadHTML = cache.wrap("loadHTML:0", async (url) => {
//   const browser = await chromium.launch();
//   const page = await browser.newPage();
//   await page.goto(url);
//   const html = await page.content();
//   await browser.close();
//   return html;
// });

// const getPageTitle = cache.wrap("getPageTitle:0", async (html) => {
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

// const google = await loadHTML("https://google.com");
// const title = await getPageTitle(google);
// console.log(title);
`;
