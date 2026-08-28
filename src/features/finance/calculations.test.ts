import { describe, expect, it } from "vitest";
import { balanceSheet, profitAndLoss, reconciliationDifference, trialBalanceTotals } from "./calculations";

describe("finance calculations", () => {
  const rows = [
    { account_type: "ASSET" as const, balance: 150 }, { account_type: "LIABILITY" as const, balance: 40 },
    { account_type: "EQUITY" as const, balance: 80 }, { account_type: "REVENUE" as const, balance: 50 },
    { account_type: "EXPENSE" as const, balance: 20 },
  ];
  it("groups profit and loss", () => expect(profitAndLoss(rows)).toEqual({ revenue: 50, expenses: 20, netProfit: 30 }));
  it("includes current earnings in the accounting equation", () => expect(balanceSheet(rows).difference).toBe(0));
  it("totals trial balance columns", () => expect(trialBalanceTotals([{ debit_balance: 12, credit_balance: 0 }, { debit_balance: 0, credit_balance: "12" }])).toEqual({ debit: 12, credit: 12 }));
  it("calculates reconciliation exceptions", () => expect(reconciliationDifference("101.50", 100)).toBe(1.5));
});
