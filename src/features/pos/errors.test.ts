import { describe, expect, it } from "vitest";
import { posError } from "./errors";
describe("POS errors", () => {
  it("maps safe business errors", () =>
    expect(posError("P0001: WALK_IN_CREDIT_NOT_ALLOWED")).toContain(
      "named customer",
    ));
  it("does not expose raw database errors", () =>
    expect(posError("relation secret_table does not exist")).toBe(
      "The POS action could not be completed.",
    ));
});
