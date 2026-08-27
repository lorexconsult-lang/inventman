import { describe, expect, it } from "vitest";
import { loginSchema, resetPasswordSchema } from "./credentials";

describe("loginSchema", () => {
  it("rejects malformed credentials", () =>
    expect(
      loginSchema.safeParse({ email: "bad", password: "short" }).success,
    ).toBe(false));
  it("accepts valid credentials", () =>
    expect(
      loginSchema.safeParse({
        email: "owner@example.com",
        password: "strong-passphrase",
      }).success,
    ).toBe(true));
});

describe("resetPasswordSchema", () => {
  it("requires matching strong passwords", () => {
    expect(
      resetPasswordSchema.safeParse({
        password: "short",
        confirmPassword: "short",
      }).success,
    ).toBe(false);
    expect(
      resetPasswordSchema.safeParse({
        password: "a-secure-passphrase",
        confirmPassword: "different-passphrase",
      }).success,
    ).toBe(false);
    expect(
      resetPasswordSchema.safeParse({
        password: "a-secure-passphrase",
        confirmPassword: "a-secure-passphrase",
      }).success,
    ).toBe(true);
  });
});
