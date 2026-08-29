import { describe, expect, it } from "vitest";
import { authorizeCronRequest, scheduledEnvironment } from "./cron";

describe("scheduled job security", () => {
  const secret = "a-production-cron-secret-value";
  it("requires an exact bearer secret", () => {
    expect(authorizeCronRequest(`Bearer ${secret}`, secret)).toBe(true);
    expect(authorizeCronRequest("Bearer wrong", secret)).toBe(false);
    expect(authorizeCronRequest(null, secret)).toBe(false);
  });
  it("runs only in staging or production", () => {
    expect(scheduledEnvironment("staging")).toBe(true);
    expect(scheduledEnvironment("production")).toBe(true);
    expect(scheduledEnvironment("development")).toBe(false);
    expect(scheduledEnvironment("local")).toBe(false);
  });
});
