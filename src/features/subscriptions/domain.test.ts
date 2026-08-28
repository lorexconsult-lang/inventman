import { describe, expect, it } from "vitest";
import { formatBillingInterval, offlineLeaseValid, platformMetrics, remainingDays, subscriptionAccessMode, usageState } from "./domain";

const now = new Date("2026-08-28T12:00:00Z");
describe("commercial subscription domain", () => {
  it("maps lifecycle states to centralized access modes", () => {
    expect(subscriptionAccessMode({ status: "ACTIVE" }, now)).toBe("FULL_ACCESS");
    expect(subscriptionAccessMode({ status: "TRIALING", trialEndsAt: new Date("2026-08-29") }, now)).toBe("FULL_ACCESS");
    expect(subscriptionAccessMode({ status: "TRIALING", trialEndsAt: new Date("2026-08-27") }, now)).toBe("READ_ONLY");
    expect(subscriptionAccessMode({ status: "PAST_DUE", graceEndsAt: new Date("2026-08-30") }, now)).toBe("GRACE_ACCESS");
    expect(subscriptionAccessMode({ status: "ACTIVE", platformSuspended: true }, now)).toBe("SUSPENDED");
  });
  it("calculates trial countdown without negative days", () => {
    expect(remainingDays(new Date("2026-08-30T12:00:00Z"), now)).toBe(2);
    expect(remainingDays(new Date("2026-08-20"), now)).toBe(0);
  });
  it("represents plan usage and downgrade overages", () => {
    expect(usageState(2, 3)).toMatchObject({ label: "2 / 3", overLimit: false });
    expect(usageState(5, 2)).toMatchObject({ overLimit: true, nearLimit: true });
  });
  it("uses deterministic offline lease timestamps", () => {
    expect(offlineLeaseValid(now, new Date("2026-08-29T12:00:00Z"), new Date("2026-08-29"))).toBe(true);
    expect(offlineLeaseValid(now, new Date("2026-08-29T12:00:00Z"), new Date("2026-08-30"))).toBe(false);
  });
  it("formats billing intervals and deterministic platform metrics", () => {
    expect(formatBillingInterval("ANNUAL")).toBe("Annual");
    expect(platformMetrics([{ status: "ACTIVE", monthlyEquivalent: 10 }, { status: "TRIALING", monthlyEquivalent: 0 }])).toEqual({ activeSubscriptions: 1, trials: 1, pastDue: 0, mrr: 10 });
  });
});
