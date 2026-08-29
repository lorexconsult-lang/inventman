import { describe, expect, it } from "vitest";
import { classifyError } from "./logger";
import { redact } from "./redaction";

describe("observability safety", () => {
  it("redacts nested credentials", () => expect(redact({ user: "ok", password: "bad", nested: { authorization: "Bearer secret" } })).toEqual({ user: "ok", password: "[REDACTED]", nested: { authorization: "[REDACTED]" } }));
  it("classifies expected errors", () => { expect(classifyError(new SyntaxError())).toBe("invalid_input"); expect(classifyError(new Error("Forbidden"))).toBe("authorization"); });
});
