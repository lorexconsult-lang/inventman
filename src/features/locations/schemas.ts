import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((value) => value || null);
export const branchSchema = z.object({
  name: z.string().trim().min(2).max(160),
  code: z
    .string()
    .trim()
    .min(1)
    .max(30)
    .transform((value) => value.toUpperCase()),
  phone: optionalText,
  email: z
    .union([z.literal(""), z.email()])
    .optional()
    .transform((value) => value || null),
  addressLine1: optionalText,
  addressLine2: optionalText,
  city: optionalText,
  region: optionalText,
  postalCode: optionalText,
  countryCode: z
    .union([
      z.literal(""),
      z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z]{2}$/),
    ])
    .optional()
    .transform((value) => value || null),
  timezone: z.string().trim().min(1).max(100),
});

export const warehouseSchema = z.object({
  branchId: z.uuid(),
  name: z.string().trim().min(2).max(160),
  code: z
    .string()
    .trim()
    .min(1)
    .max(30)
    .transform((value) => value.toUpperCase()),
  warehouseType: z.enum([
    "MAIN",
    "SHOP_FLOOR",
    "DISTRIBUTION",
    "RETURNS",
    "DAMAGED",
    "EXPIRED",
    "PRODUCTION",
    "TRANSIT",
    "OTHER",
  ]),
  description: optionalText,
  isDefault: z
    .string()
    .optional()
    .transform((value) => value === "on"),
});

export const storageLocationSchema = z.object({
  branchId: z.uuid(),
  warehouseId: z.uuid(),
  parentLocationId: z
    .union([z.literal(""), z.uuid()])
    .transform((value) => value || null),
  name: z.string().trim().min(1).max(120),
  code: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .transform((value) => value.toUpperCase()),
  locationType: z.enum(["ZONE", "AISLE", "RACK", "SHELF", "BIN", "OTHER"]),
  description: optionalText,
});
