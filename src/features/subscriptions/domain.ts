export type SubscriptionStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "GRACE_PERIOD" | "CANCELLED" | "EXPIRED" | "SUSPENDED";
export type AccessMode = "FULL_ACCESS" | "GRACE_ACCESS" | "READ_ONLY" | "SUSPENDED";

export function subscriptionAccessMode(input: { status: SubscriptionStatus; trialEndsAt?: Date | null; graceEndsAt?: Date | null; platformSuspended?: boolean }, now = new Date()): AccessMode {
  if (input.platformSuspended || input.status === "SUSPENDED") return "SUSPENDED";
  if (input.status === "ACTIVE") return "FULL_ACCESS";
  if (input.status === "TRIALING") return input.trialEndsAt && input.trialEndsAt > now ? "FULL_ACCESS" : "READ_ONLY";
  if ((input.status === "PAST_DUE" || input.status === "GRACE_PERIOD") && input.graceEndsAt && input.graceEndsAt > now) return "GRACE_ACCESS";
  return "READ_ONLY";
}

export function remainingDays(end: Date | null | undefined, now = new Date()) {
  if (!end) return 0;
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000));
}

export function usageState(used: number, limit: number | null) {
  if (limit === null) return { label: `${used} / Unlimited`, ratio: 0, overLimit: false, nearLimit: false };
  const ratio = limit === 0 ? (used ? 1 : 0) : used / limit;
  return { label: `${used} / ${limit}`, ratio, overLimit: used > limit, nearLimit: ratio >= 0.8 };
}

export function formatBillingInterval(interval: string) {
  return interval === "MONTHLY" ? "Monthly" : interval === "ANNUAL" ? "Annual" : "Custom agreement";
}

export function offlineLeaseValid(validatedAt: Date, expiresAt: Date, localCreatedAt: Date) {
  return localCreatedAt >= validatedAt && localCreatedAt <= expiresAt;
}

export function platformMetrics(subscriptions: Array<{ status: string; monthlyEquivalent: number }>) {
  const active = subscriptions.filter((item) => item.status === "ACTIVE");
  return { activeSubscriptions: active.length, trials: subscriptions.filter((item) => item.status === "TRIALING").length, pastDue: subscriptions.filter((item) => ["PAST_DUE", "GRACE_PERIOD"].includes(item.status)).length, mrr: active.reduce((sum, item) => sum + item.monthlyEquivalent, 0) };
}
