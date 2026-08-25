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
});
