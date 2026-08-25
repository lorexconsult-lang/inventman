import { describe, expect, it } from "vitest";
import { csvEscape, parseCsv, validateCatalogueCsv } from "./csv";
const header =
  "product_name,sku,barcode,category,brand,base_unit,selling_price,reference_cost,reorder_point,product_type";
describe("catalogue CSV", () => {
  it("parses quoted commas and escaped quotes", () => {
    expect(parseCsv('"Tea, large","A""1"\n')).toEqual([["Tea, large", 'A"1']]);
  });
  it("reports duplicate SKU and barcode", () => {
    const rows = validateCatalogueCsv(
      `${header}\nOne,A,123,,,Each,1,1,0,STOCKED_PRODUCT\nTwo,A,123,,,Each,2,1,0,SERVICE`,
    );
    expect(rows.every((r) => r.errors.length === 2)).toBe(true);
  });
  it("rejects negative money", () => {
    expect(
      validateCatalogueCsv(`${header}\nOne,,, ,,Each,-1,0,0,STOCKED_PRODUCT`)[0]
        .errors,
    ).toContain("Invalid selling price");
  });
  it("escapes export values", () => {
    expect(csvEscape('a,"b"')).toBe('"a,""b"""');
  });
});
