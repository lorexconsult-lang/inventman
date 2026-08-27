import { describe, expect, it } from "vitest";
import { paymentError } from "./errors";

describe("payment errors", () => {
  it("maps authoritative business codes", () => expect(paymentError("P0001: PAYMENT_CURRENCY_MISMATCH")).toContain("currencies"));
  it("does not expose unknown database errors", () => expect(paymentError("secret SQL detail")).toBe("The settlement operation could not be completed."));
});
