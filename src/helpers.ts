export const initialScript = `import { FileSQLiteCache } from "rumrunner";
import { chromium } from "@playwright/test";
import OpenRouter from "@openrouter/api";
import { z } from "zod";

// Initialize cache and AI client
const cache = new FileSQLiteCache("./cache.db");
const openrouter = new OpenRouter({
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

const google = await loadHTML("https://google.com");

const getPageTitle = cache.wrap("getPageTitle:0", async (html: string) => {
  const completion = await openrouter.chat.completions.create({
    model: "anthropic/claude-3-sonnet-20240229",
    messages: [
      {
        role: "user",
        content: \`Extract the title of the page from the following HTML: \${html}\`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const result = z.object({
    title: z.string(),
  }).parse(JSON.parse(completion.choices[0].message.content || "{}"));

  return result.title;
});

const title = await getPageTitle(google);

console.log(title);`;
