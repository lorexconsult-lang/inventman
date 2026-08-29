import { describe, expect, it } from "vitest";
import { parseServerEnvironment, productionReadiness } from "./server";

describe("server environment", () => {
  it("models local defaults without exposing values", () => expect(productionReadiness(parseServerEnvironment({}))).toMatchObject({ environment: "local", smtpConfigured: false, monitoringConfigured: false }));
  it("rejects an unidentified production release", () => expect(() => parseServerEnvironment({ APP_ENV: "production" })).toThrow(/APP_VERSION/));
  it("accepts a versioned production release", () => expect(parseServerEnvironment({ APP_ENV: "production", APP_VERSION: "abc123" }).APP_VERSION).toBe("abc123"));
});
