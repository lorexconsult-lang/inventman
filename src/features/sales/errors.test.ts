import { describe, expect, it } from "vitest";
import { salesError } from "./errors";

describe("salesError", () => {
  it("maps stable database errors without leaking SQL", () => {
    expect(salesError("P0001: CREDIT_LIMIT_EXCEEDED detail")).toContain(
      "credit limit",
    );
    expect(salesError("sensitive internal error")).not.toContain("sensitive");
  });
});
