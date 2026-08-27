export type Allocation = { invoiceId: string; amount: number };

export function allocationTotal(allocations: Allocation[]) {
  return allocations.reduce((sum, item) => sum + item.amount, 0);
}

export function unallocatedAmount(amount: number, allocations: Allocation[]) {
  return Math.max(0, amount - allocationTotal(allocations));
}

export function paymentStatus(amount: number, allocated: number, refunded = 0) {
  if (refunded >= amount) return "REFUNDED";
  if (refunded > 0) return "PARTIALLY_REFUNDED";
  if (allocated >= amount) return "ALLOCATED";
  if (allocated > 0) return "PARTIALLY_ALLOCATED";
  return "POSTED";
}

export function invoiceSettlementStatus(
  total: number,
  credits: number,
  payments: number,
) {
  const outstanding = Math.max(0, total - credits - payments);
  if (outstanding === 0) return payments === 0 ? "CREDITED" : "PAID";
  return credits > 0 || payments > 0 ? "PARTIALLY_PAID" : "ISSUED";
}

export function refundAvailable(source: number, allocated: number, refunded: number) {
  return Math.max(0, source - allocated - refunded);
}

export function statementRows(
  entries: Array<{ date: string; number: string; debit: number; credit: number }>,
) {
  let balance = 0;
  return [...entries]
    .sort((a, b) => a.date.localeCompare(b.date) || a.number.localeCompare(b.number))
    .map((entry) => ({ ...entry, balance: (balance += entry.debit - entry.credit) }));
}
