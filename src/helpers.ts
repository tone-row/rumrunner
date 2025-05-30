export const initialScript = `import { FileSQLiteCache, product, rumrunnerServer } from \"rumrunner\";
// import { chromium } from \"@playwright/test\";
// import { generateObject } from \"ai\";
// import { createOpenRouter } from \"@openrouter/ai-sdk-provider\";
// import { z } from \"zod\";
// import { createOllama } from 'ollama-ai-provider';

// const ollama = createOllama({
//   // optional settings, e.g.
//   baseURL: 'https://api.ollama.com',
// });

// Initialize Cache
const cache = new FileSQLiteCache(\"./cache.db\");

// Example: Use product to generate parameter combinations
const names = new Set([\"John\", \"Jane\", \"Jim\", \"Jill\", \"Jason\", \"Jenny\"]);
const greetings = new Set([\"Hello\", \"Hi\", \"Hey\"]);
const combos = product({ name: names, greeting: greetings });

const cowSay = cache.wrapWithQueue(
  \"cowSay:0\",
  async (name, greeting) => {
    return \`Cow: - \${greeting}, \${name}!\`;
  }
);

(async () => {
  // Queue all jobs
  for (const { name, greeting } of combos) {
    await cowSay.queue(name, greeting);
  }

  // Process the queue (run all pending jobs)
  await cowSay.processQueue();

  // Optionally, call directly (bypasses queue)
  // const result = await cowSay.call(\"John\", \"Hello\");
  // console.log(result);
})();

export default rumrunnerServer();

// --- Advanced: Scraping and LLM (uncomment to use) ---
// const openrouter = createOpenRouter({
//   apiKey: process.env.OPENROUTER_API_KEY,
// });

// const loadHTML = cache.wrapWithQueue(\"loadHTML:0\", async (url) => {
//   const browser = await chromium.launch();
//   const page = await browser.newPage();
//   await page.goto(url);
//   const html = await page.content();
//   await browser.close();
//   return html;
// });

// const getPageTitle = cache.wrapWithQueue(\"getPageTitle:0\", async (html) => {
//   const { object } = await generateObject({
//     model: openrouter(\"claude-3-5-sonnet-latest\"),
//     schema: z.object({
//       title: z.string(),
//     }),
//     messages: [
//       {
//         role: \"user\",
//         content: \`Extract the title of the page from the following HTML: \${html}\`,
//       },
//     ],
//   });
//   return object.title;
// });

// await loadHTML.queue(\"https://google.com\");
// await loadHTML.processQueue();
// await getPageTitle.queue(\"<html>...</html>\");
// await getPageTitle.processQueue();
// console.log(await getPageTitle.call(\"<html>...</html>\"));
`;
