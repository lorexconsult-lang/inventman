import { expect, test } from "@playwright/test";

test("public website routes and navigation are complete", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("stock, sales, cash and profitability");
  for (const path of ["/features", "/pricing", "/about", "/security", "/contact"] as const) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('a[href="#"]')).toHaveCount(0);
  }
});

test("commercial signup preserves only safe plan identity", async ({ page }) => {
  await page.goto("/signup?plan=growth");
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  await expect(page.locator('input[name="plan"]')).toHaveValue("GROWTH");
  await page.goto("/signup?plan=../../private");
  await expect(page.locator('input[name="plan"]')).toHaveCount(0);
});

test("robots and sitemap expose public routes only", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /dashboard");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/pricing");
  expect(sitemap).not.toContain("/dashboard");
});

test("public pages fit a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/pricing", "/signup?plan=STARTER"]) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
});
