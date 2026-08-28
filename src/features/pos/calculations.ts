export type PosLine = {
  variantId: string;
  packagingId: string;
  label: string;
  packaging: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
  /** Last-known device snapshot fields. Never authoritative on the server. */
  availableBase?: number;
  conversion?: number;
};

export type PosSettlement = {
  sourceType: "PAYMENT" | "UNAPPLIED_PAYMENT" | "CREDIT_NOTE";
  amount: number;
  paymentMethodId?: string;
  accountId?: string;
  sourceId?: string;
  reference?: string;
  tenderedAmount?: number;
};

const money = (value: number) =>
  Math.round((value + Number.EPSILON) * 10000) / 10000;

export function lineTotals(line: PosLine) {
  const gross = money(line.quantity * line.unitPrice);
  const discount = money(Math.min(Math.max(line.discount, 0), gross));
  const taxable = money(gross - discount);
  const tax = money(taxable * (line.taxRate / 100));
  return { gross, discount, tax, total: money(taxable + tax) };
}

export function cartTotals(lines: PosLine[]) {
  return lines.reduce(
    (result, line) => {
      const totals = lineTotals(line);
      result.subtotal = money(result.subtotal + totals.gross);
      result.discount = money(result.discount + totals.discount);
      result.tax = money(result.tax + totals.tax);
      result.total = money(result.total + totals.total);
      return result;
    },
    { subtotal: 0, discount: 0, tax: 0, total: 0 },
  );
}

export function settlementTotals(settlements: PosSettlement[]) {
  const allocated = money(
    settlements.reduce((sum, item) => sum + Math.max(item.amount, 0), 0),
  );
  const cashTendered = money(
    settlements.reduce(
      (sum, item) => sum + Math.max(item.tenderedAmount ?? 0, 0),
      0,
    ),
  );
  const cashApplied = money(
    settlements.reduce(
      (sum, item) =>
        sum +
        (item.tenderedAmount === undefined ? 0 : Math.max(item.amount, 0)),
      0,
    ),
  );
  return {
    allocated,
    cashTendered,
    change: money(Math.max(cashTendered - cashApplied, 0)),
  };
}
