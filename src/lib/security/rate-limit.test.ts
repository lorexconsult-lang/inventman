import { describe, expect, it } from "vitest";
import { consumeLocalRateLimit } from "./rate-limit";

describe("local rate-limit fallback", () => {
  it("returns a structured denial and resets", () => { const key = crypto.randomUUID(); expect(consumeLocalRateLimit(key, 1, 1000, 10).allowed).toBe(true); expect(consumeLocalRateLimit(key, 1, 1000, 11).allowed).toBe(false); expect(consumeLocalRateLimit(key, 1, 1000, 1010).allowed).toBe(true); });
});
