export const initialScript = `import { FileSQLiteCache } from "rumrunner";
import { chromium } from "@playwright/test";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import { createOllama } from 'ollama-ai-provider';

const ollama = createOllama({
  // optional settings, e.g.
  baseURL: 'https://api.ollama.com',
});

// Initialize Cache
const cache = new FileSQLiteCache("./cache.db");

// Initialize OpenRouter client
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const loadHTML = cache.wrap("loadHTML:0", async (url: string) => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url);
  const html = await page.content();
  await browser.close();
  return html;
});


const getPageTitle = cache.wrap("getPageTitle:0", async (html: string) => {
  const { object } = await generateObject({
    model: openrouter("claude-3-5-sonnet-latest"),
    schema: z.object({
      title: z.string(),
    }),
    messages: [
      {
        role: "user",
        content: \`Extract the title of the page from the following HTML: \${html}\`,
      },
    ],
  });

  return object.title;
});

const google = await loadHTML("https://google.com");
const title = await getPageTitle(google);

console.log(title);`;
