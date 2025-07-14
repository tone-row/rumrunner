// Simple test to verify UI is working
const puppeteer = require("puppeteer");

(async () => {
  console.log("Starting UI test...");

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to the UI
    await page.goto("http://localhost:3000");

    // Wait for the content to load
    await page.waitForTimeout(2000);

    // Check if jobs are displayed
    const jobsContent = await page.evaluate(() => {
      const jobsElement = document.querySelector("pre");
      return jobsElement ? jobsElement.textContent : null;
    });

    console.log("Jobs content found:", jobsContent ? "Yes" : "No");
    if (jobsContent) {
      console.log("Jobs content:", jobsContent.substring(0, 200) + "...");
    }

    // Check if functions are displayed
    const functionsContent = await page.evaluate(() => {
      const functionsElement = document.querySelectorAll("pre")[1];
      return functionsElement ? functionsElement.textContent : null;
    });

    console.log("Functions content found:", functionsContent ? "Yes" : "No");
    if (functionsContent) {
      console.log(
        "Functions content:",
        functionsContent.substring(0, 200) + "..."
      );
    }
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await browser.close();
  }
})();
