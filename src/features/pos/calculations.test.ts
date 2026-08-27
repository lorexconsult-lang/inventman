import { describe, expect, it } from "vitest";
import { cartTotals, lineTotals, settlementTotals } from "./calculations";

describe("POS calculations", () => {
  it("calculates quantity, discount and tax", () =>
    expect(
      lineTotals({
        variantId: "v",
        packagingId: "p",
        label: "Tea",
        packaging: "Each",
        quantity: 2,
        unitPrice: 100,
        taxRate: 7.5,
        discount: 20,
      }),
    ).toEqual({ gross: 200, discount: 20, tax: 13.5, total: 193.5 }));
  it("combines cart totals deterministically", () =>
    expect(
      cartTotals([
        {
          variantId: "v1",
          packagingId: "p1",
          label: "One",
          packaging: "Each",
          quantity: 2,
          unitPrice: 10,
          taxRate: 0,
          discount: 0,
        },
        {
          variantId: "v2",
          packagingId: "p2",
          label: "Two",
          packaging: "Each",
          quantity: 1,
          unitPrice: 50,
          taxRate: 10,
          discount: 5,
        },
      ]),
    ).toEqual({ subtotal: 70, discount: 5, tax: 4.5, total: 69.5 }));
  it("keeps split tender and change explicit", () =>
    expect(
      settlementTotals([
        { sourceType: "PAYMENT", amount: 20, tenderedAmount: 30 },
        { sourceType: "PAYMENT", amount: 10 },
        { sourceType: "CREDIT_NOTE", amount: 5, sourceId: "credit" },
      ]),
    ).toEqual({ allocated: 35, cashTendered: 30, change: 10 }));
});
