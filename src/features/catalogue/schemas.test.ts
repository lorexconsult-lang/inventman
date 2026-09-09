import { describe, expect, it } from "vitest";
import { packagingSchema, simpleProductSchema } from "./schemas";
const uuid = "11111111-1111-4111-8111-111111111111";
describe("catalogue schemas", () => {
  it("forces optional values to null and accepts a valid product", () => {
    const result = simpleProductSchema.parse({
      name: "Service",
      productType: "SERVICE",
      categoryId: "",
      brandId: "",
      taxProfileId: "",
      unitId: uuid,
      priceListId: "",
      sku: "",
      barcode: "",
      price: "",
      referenceCost: "",
      reorderPoint: "",
      idempotencyKey: uuid,
    });
    expect(result.categoryId).toBeNull();
    expect(result.price).toBeNull();
  });
  it("requires positive package conversion", () => {
    expect(
      packagingSchema.safeParse({
        variantId: uuid,
        unitId: uuid,
        name: "Case",
        conversionToBase: 0,
      }).success,
    ).toBe(false);
  });

  it("requires a price list when a selling price is provided", () => {
    const result = simpleProductSchema.safeParse({
      name: "Price list regression",
      productType: "STOCKED_PRODUCT",
      categoryId: "",
      brandId: "",
      taxProfileId: "",
      unitId: "00000000-0000-4000-8000-000000000001",
      priceListId: "",
      sku: "",
      barcode: "",
      price: "10",
      referenceCost: "",
      reorderPoint: "",
      trackInventory: "on",
      idempotencyKey: "00000000-0000-4000-8000-000000000002",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("price list");
    }
  });
});
