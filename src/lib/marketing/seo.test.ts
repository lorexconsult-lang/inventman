import { describe, expect, it } from "vitest";
import { featurePages, industryPages, publicRoutePaths, resourcePages } from "./content";
import { faqSchema, publicIndexingEnabled, publicMetadata } from "./seo";

describe("public search architecture", () => {
  it("keeps non-production environments out of search", () => {
    expect(publicIndexingEnabled({ APP_ENV: "staging" })).toBe(false);
    expect(publicIndexingEnabled({ APP_ENV: "development" })).toBe(false);
    expect(publicIndexingEnabled({ APP_ENV: "production" })).toBe(true);
  });

  it("builds canonical metadata with environment-aware robots", () => {
    const previous = process.env.APP_ENV;
    process.env.APP_ENV = "staging";
    const metadata = publicMetadata({ title: "Inventory Management Software | Inventman", description: "Useful description for an inventory page.", path: "/features/inventory-management" });
    expect(metadata.alternates).toEqual({ canonical: "/features/inventory-management" });
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
    if (previous === undefined) delete process.env.APP_ENV;
    else process.env.APP_ENV = previous;
  });

  it("publishes only substantive public routes", () => {
    expect(publicRoutePaths).toContain("/features/inventory-management");
    expect(publicRoutePaths).toContain("/industries/supermarkets");
    expect(publicRoutePaths).toContain("/resources/prevent-stock-loss");
    expect(publicRoutePaths.some((path) => path.startsWith("/dashboard"))).toBe(false);
    expect(new Set(publicRoutePaths).size).toBe(publicRoutePaths.length);
  });

  it("keeps landing-page metadata and headings unique", () => {
    const pages = [...featurePages, ...industryPages];
    expect(new Set(pages.map((page) => page.title)).size).toBe(pages.length);
    expect(new Set(pages.map((page) => page.intro)).size).toBe(pages.length);
    expect(resourcePages.every((page) => page.sections.length >= 5)).toBe(true);
  });

  it("creates visible FAQ-compatible structured data", () => {
    const items = featurePages[0].faq;
    const schema = faqSchema(items);
    expect(schema.mainEntity).toHaveLength(items.length);
    expect(schema.mainEntity[0].acceptedAnswer.text).toBe(items[0].answer);
    expect(() => JSON.parse(JSON.stringify(schema))).not.toThrow();
  });
});
