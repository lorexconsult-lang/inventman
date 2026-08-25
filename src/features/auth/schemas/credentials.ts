import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must contain at least 8 characters")
});

export const registrationSchema = loginSchema.extend({
  fullName: z.string().trim().min(2, "Enter your full name").max(120)
});

export const verificationSchema = z.object({
  email: z.email("Enter a valid email address"),
  token: z.string().trim().regex(/^[a-zA-Z0-9]{6,10}$/, "Enter the Supabase one-time code"),
});
