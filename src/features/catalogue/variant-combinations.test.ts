import { describe, expect, it } from "vitest";
import { generateVariantCombinations } from "./variant-combinations";
describe("generateVariantCombinations", () => {
  it("creates a deterministic cartesian product", () => {
    expect(
      generateVariantCombinations([
        { name: "Size", values: ["S", "M"] },
        { name: "Colour", values: ["Blue", "Red"] },
      ]),
    ).toEqual([
      { name: "S / Blue", attributes: { Size: "S", Colour: "Blue" } },
      { name: "S / Red", attributes: { Size: "S", Colour: "Red" } },
      { name: "M / Blue", attributes: { Size: "M", Colour: "Blue" } },
      { name: "M / Red", attributes: { Size: "M", Colour: "Red" } },
    ]);
  });
  it("normalizes empty and duplicate values", () => {
    expect(
      generateVariantCombinations([
        { name: " Size ", values: ["S", "S", " "] },
      ]),
    ).toHaveLength(1);
  });
  it("returns no variants without valid options", () => {
    expect(generateVariantCombinations([])).toEqual([]);
  });
});
