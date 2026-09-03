const baseUrl = (process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3100").replace(/\/$/, "");

const decodeXml = (value) =>
  value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");

const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`);
if (!sitemapResponse.ok) {
  throw new Error(`Sitemap request failed with ${sitemapResponse.status}`);
}

const sitemap = await sitemapResponse.text();
const routes = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => {
  const pathname = new URL(decodeXml(match[1])).pathname;
  return `${baseUrl}${pathname}`;
});

if (routes.length < 20) {
  throw new Error(`Expected at least 20 public routes, found ${routes.length}`);
}

const failures = [];
for (const url of routes) {
  const response = await fetch(url, { redirect: "manual" });
  const html = await response.text();
  const pathname = new URL(url).pathname;
  const structuredDataExpected = !new Set(["/privacy", "/terms"]).has(pathname);
  const checks = {
    status: response.status === 200,
    title: /<title>[^<]{10,}<\/title>/i.test(html),
    description: /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{40,}["']/i.test(html),
    canonical: /<link[^>]+rel=["']canonical["']/i.test(html),
    heading: /<h1(?:\s[^>]*)?>[\s\S]*?<\/h1>/i.test(html),
    jsonLd:
      !structuredDataExpected ||
      /<script[^>]+type=["']application\/ld\+json["']/i.test(html),
  };

  const failedChecks = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failedChecks.length > 0) failures.push(`${url}: ${failedChecks.join(", ")}`);
}

if (failures.length > 0) {
  throw new Error(`Public route audit failed:\n${failures.join("\n")}`);
}

console.log(`Public route audit passed for ${routes.length} sitemap URLs.`);
