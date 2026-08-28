import { describe, expect, it } from "vitest";
import { financeError } from "./errors";
describe("finance errors", () => { it("maps structured errors", () => expect(financeError("P0001: PERIOD_CLOSED")).toBe("The accounting period is closed.")); it("does not expose database errors", () => expect(financeError("secret internal detail")).not.toContain("secret")); });
