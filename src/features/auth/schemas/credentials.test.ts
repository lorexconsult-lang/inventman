import { describe, expect, it } from "vitest";
import { loginSchema } from "./credentials";

describe("loginSchema", () => {
  it("rejects malformed credentials", () => expect(loginSchema.safeParse({ email: "bad", password: "short" }).success).toBe(false));
  it("accepts valid credentials", () => expect(loginSchema.safeParse({ email: "owner@example.com", password: "strong-passphrase" }).success).toBe(true));
});
