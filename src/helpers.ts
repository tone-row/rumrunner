export const initialScript = `import { cache } from "rumrunner";
import { chromium } from "@playwright/test";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

const loadHTML = cache("loadHTML:0", async (url: string) => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url);
  const html = await page.content();
  await browser.close();
  return html;
});

const google = await loadHTML("https://google.com");

const getPageTitle = cache("getPageTitle:1", async (html: string) => {
  const { object } = await generateObject({
    model: anthropic("claude-3-5-sonnet-20240620"),
    schema: z.object({
      title: z.string(),
    }),
    prompt: \`Extract the title of the page from the following HTML: \${html}\`,
  });

  return object.title;
});

const title = await getPageTitle(google);

console.log(title);`;
