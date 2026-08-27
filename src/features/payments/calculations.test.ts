import { describe, expect, it } from "vitest";
import { allocationTotal, invoiceSettlementStatus, paymentStatus, refundAvailable, statementRows, unallocatedAmount } from "./calculations";

describe("payment settlement calculations", () => {
  it("totals multi-invoice allocations", () => expect(allocationTotal([{ invoiceId: "a", amount: 60 }, { invoiceId: "b", amount: 30 }])).toBe(90));
  it("preserves unapplied overpayment", () => expect(unallocatedAmount(100, [{ invoiceId: "a", amount: 80 }])).toBe(20));
  it("maps allocation states", () => { expect(paymentStatus(100, 0)).toBe("POSTED"); expect(paymentStatus(100, 40)).toBe("PARTIALLY_ALLOCATED"); expect(paymentStatus(100, 100)).toBe("ALLOCATED"); });
  it("maps refund states", () => { expect(paymentStatus(100, 50, 20)).toBe("PARTIALLY_REFUNDED"); expect(paymentStatus(100, 50, 100)).toBe("REFUNDED"); });
  it("derives invoice states", () => { expect(invoiceSettlementStatus(500, 50, 200)).toBe("PARTIALLY_PAID"); expect(invoiceSettlementStatus(500, 0, 500)).toBe("PAID"); expect(invoiceSettlementStatus(500, 500, 0)).toBe("CREDITED"); });
  it("caps refundable credit", () => expect(refundAvailable(100, 80, 10)).toBe(10));
  it("formats a deterministic running statement", () => expect(statementRows([{ date: "2026-01-02", number: "P-1", debit: 0, credit: 40 }, { date: "2026-01-01", number: "I-1", debit: 100, credit: 0 }]).map((x) => x.balance)).toEqual([100, 60]));
});
