import { chromium } from "@playwright/test";

const baseUrl = (process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3100").replace(/\/$/, "");
const browser = await chromium.launch();

try {
  for (const viewport of [
    { name: "mobile", width: 390, height: 844 },
    { name: "desktop", width: 1440, height: 900 },
  ]) {
    const page = await browser.newPage({ viewport });
    let transferBytes = 0;
    page.on("response", (response) => {
      const value = Number(response.headers()["content-length"] ?? 0);
      if (Number.isFinite(value)) transferBytes += value;
    });

    await page.goto(baseUrl, { waitUntil: "networkidle" });
    const result = await page.evaluate(() => {
      const navigation = performance.getEntriesByType("navigation")[0];
      return {
        domContentLoadedMs: Math.round(navigation.domContentLoadedEventEnd),
        loadMs: Math.round(navigation.loadEventEnd),
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
        h1Count: document.querySelectorAll("h1").length,
        hasMain: Boolean(document.querySelector("main")),
        hasNav: Boolean(document.querySelector("nav")),
      };
    });

    if (result.horizontalOverflow || result.h1Count !== 1 || !result.hasMain || !result.hasNav) {
      throw new Error(`${viewport.name} structure/responsiveness audit failed: ${JSON.stringify(result)}`);
    }

    console.log(
      `${viewport.name}: DOMContentLoaded ${result.domContentLoadedMs}ms, load ${result.loadMs}ms, declared transfer ${(transferBytes / 1024).toFixed(1)} KiB`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
