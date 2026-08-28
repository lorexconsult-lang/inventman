import { expect, test } from "@playwright/test";

test("serves an installable manifest and a safe offline shell", async ({
  page,
  context,
  request,
}) => {
  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  const manifest = (await manifestResponse.json()) as {
    name: string;
    short_name: string;
    start_url: string;
    display: string;
    icons: unknown[];
  };
  expect(manifest.name).toContain("Inventman");
  expect(manifest.short_name).toBe("Inventman");
  expect(manifest.start_url).toBe("/dashboard/pos");
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  expect(
    await page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
  ).toBe(true);
  await context.setOffline(true);
  await page.goto("/offline-verification");
  await expect(page.getByRole("heading", { name: "You are offline" })).toBeVisible();
  await expect(page.getByText(/remains in IndexedDB/)).toBeVisible();
  await context.setOffline(false);
});

test("keeps queued IndexedDB records across an offline reload", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("inventman-offline", 3);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("sync_queue"))
          request.result.createObjectStore("sync_queue", { keyPath: "queueId" });
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction("sync_queue", "readwrite");
        transaction.objectStore("sync_queue").put({ queueId: "pending-1" });
        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
    });
  });
  await page.reload();
  await context.setOffline(true);
  await page.goto("/offline-reload");
  await expect(page.getByText("1 local queue record preserved on this device.")).toBeVisible();
  await page.reload();
  await expect(page.getByText("1 local queue record preserved on this device.")).toBeVisible();
  await context.setOffline(false);
});
