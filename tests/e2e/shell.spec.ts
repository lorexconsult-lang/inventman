import { expect, test } from "@playwright/test";

test("renders the public home and auth routes without console errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Control your stock, sales, cash and profitability.*Run your entire business from one connected platform/,
    }),
  ).toBeVisible();
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Sign in to your workspace" }),
  ).toBeVisible();
  await page.goto("/auth/register");
  await expect(
    page.getByRole("heading", { name: "Create your account" }),
  ).toBeVisible();
  await page.goto("/auth/forgot-password");
  await expect(
    page.getByRole("heading", { name: "Reset your password" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("rejects unauthenticated dashboard access", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/auth\/login\?next=%2Fdashboard$/);
});

test("rejects unauthenticated onboarding access", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/auth\/login$/);
});

test("fails closed on invalid callbacks and ignores external redirect targets", async ({
  request,
}) => {
  const response = await request.get(
    "/auth/callback?code=invalid&next=https://example.com",
    { maxRedirects: 0 },
  );
  expect(response.status()).toBe(307);
  expect(response.headers().location).toMatch(/\/auth\/login\?error=callback$/);
  expect(response.headers()["cache-control"]).toContain("no-store");
});
