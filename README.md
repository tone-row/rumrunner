# rumrunner

A CLI tool for quickly bootstrapping TypeScript projects with built-in caching and AI capabilities.

## Features

- 🚀 Instant project setup with TypeScript and Bun
- 💾 Built-in persistent caching system
- 🎭 Playwright integration for web scraping
- 🤖 AI integration with Anthropic and OpenAI
- 🔑 Secure environment variable management
- 📦 Zero-config caching to JSON
- 🔄 Version-based cache invalidation

## Installation

```bash
bun install -g rumrunner
```

## Quick Start

```bash
# Create a new project
rumrunner

# This will:
# 1. Create a new directory
# 2. Set up TypeScript configuration
# 3. Install dependencies
# 4. Open your editor
# 5. Change to the project directory

# Start your development server
bun run --watch index.ts
```

## Caching

The `cache` function provides persistent caching with version control:

```typescript
import { cache } from "rumrunner";

// Simple example
const hello = cache<string>("hello:0", (name: string) => {
  return `Hello, ${name}!`;
});

// Async example with Playwright
const loadHTML = cache("loadHTML:0", async (url: string) => {
  const browser = await chromium.launch({
    headless: true,
  });
  const page = await browser.newPage();
  await page.goto(url);
  const html = await page.content();
  await browser.close();
  return html;
});

// Cache invalidation by version increment
const loadHTMLv2 = cache("loadHTML:1", async (url: string) => {
  // New implementation...
});
```

## Environment Variables

Store your API keys and configuration in `~/.rumrunner`:

```bash
# ~/.rumrunner
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
DEBUG=true  # Enable detailed cache logging
```

The CLI automatically copies this file to `.env` in new projects. The `.env` file is automatically added to `.gitignore`.

## AI Integration

Built-in support for AI services:

```typescript
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

const getPageTitle = cache("getPageTitle:1", async (html: string) => {
  const { object } = await generateObject({
    model: anthropic("claude-3-5-sonnet-20240620"),
    schema: z.object({
      title: z.string(),
    }),
    prompt: `Extract the title of the page from the following HTML: ${html}`,
  });

  return object.title;
});
```

## Debug Logging

Set `DEBUG=true` in your `~/.rumrunner` file to enable detailed cache logging:
- Cache hits and misses
- Cache version changes
- File I/O operations

## Project Structure

```
your-project/
├── .env              # Created from ~/.rumrunner
├── cache.json        # Persistent cache storage
├── index.ts         # Main entry point
├── package.json     # Project dependencies
└── tsconfig.json    # TypeScript configuration
```

## Dependencies

- Bun runtime
- TypeScript
- Playwright for web automation
- AI SDKs (Anthropic, OpenAI)
- Zod for schema validation

## License

MIT

