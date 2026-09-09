import { z } from "zod";

const nullableUuid = z
  .union([z.literal(""), z.uuid()])
  .transform((value) => value || null);
const nullableMoney = z
  .union([z.literal(""), z.coerce.number().min(0)])
  .transform((value) => (value === "" ? null : value));
const nullableQuantity = z
  .union([z.literal(""), z.coerce.number().min(0)])
  .transform((value) => (value === "" ? null : value));
export const categorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  parentId: nullableUuid,
  description: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => v || null),
});
export const brandSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => v || null),
});
export const unitSchema = z.object({
  name: z.string().trim().min(1).max(80),
  symbol: z.string().trim().min(1).max(20),
  dimension: z.enum(["COUNT", "WEIGHT", "VOLUME", "LENGTH", "AREA", "OTHER"]),
});
export const taxSchema = z.object({
  name: z.string().trim().min(1).max(100),
  code: z.string().trim().toUpperCase().min(1).max(30),
  rate: z.coerce.number().min(0).max(100),
  calculation: z.enum(["INCLUSIVE", "EXCLUSIVE"]),
  taxTreatment: z.enum(["STANDARD", "ZERO_RATED", "EXEMPT"]),
});
export const priceListSchema = z.object({
  name: z.string().trim().min(1).max(100),
  code: z.string().trim().toUpperCase().min(1).max(30),
  description: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => v || null),
  currencyCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/),
  isDefault: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});
export const simpleProductSchema = z
  .object({
    name: z.string().trim().min(1).max(180),
    productType: z.enum([
      "STOCKED_PRODUCT",
      "NON_STOCKED_PRODUCT",
      "SERVICE",
      "BUNDLE",
      "RECIPE",
      "SERIALIZED_PRODUCT",
      "BATCH_CONTROLLED_PRODUCT",
      "PERISHABLE_PRODUCT",
    ]),
    categoryId: nullableUuid,
    brandId: nullableUuid,
    taxProfileId: nullableUuid,
    unitId: z.uuid(),
    priceListId: nullableUuid,
    sku: z
      .string()
      .trim()
      .max(100)
      .optional()
      .transform((v) => v || ""),
    barcode: z
      .string()
      .trim()
      .max(100)
      .optional()
      .transform((v) => v || ""),
    price: nullableMoney,
    referenceCost: nullableMoney,
    reorderPoint: nullableQuantity,
    trackInventory: z
      .string()
      .optional()
      .transform((v) => v === "on"),
    idempotencyKey: z.uuid(),
  })
  .superRefine((value, context) => {
    if (value.price !== null && value.priceListId === null) {
      context.addIssue({
        code: "custom",
        path: ["priceListId"],
        message: "Select a price list when entering a selling price",
      });
    }
  });
export const packagingSchema = z.object({
  variantId: z.uuid(),
  unitId: z.uuid(),
  name: z.string().trim().min(1).max(100),
  conversionToBase: z.coerce.number().positive(),
  canPurchase: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  canSell: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});
export const barcodeSchema = z.object({
  variantId: z.uuid(),
  packagingId: nullableUuid,
  barcode: z.string().trim().min(3).max(100),
  barcodeType: z.enum([
    "EAN8",
    "EAN13",
    "UPC_A",
    "UPC_E",
    "CODE39",
    "CODE128",
    "ISBN",
    "GTIN",
    "CUSTOM",
  ]),
  isPrimary: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});
export const productPriceSchema = z.object({
  variantId: z.uuid(),
  packagingId: z.uuid(),
  priceListId: z.uuid(),
  branchId: nullableUuid,
  minQuantity: z.coerce.number().positive(),
  amount: z.coerce.number().min(0),
});
export const variantProductSchema = z.object({
  name: z.string().trim().min(1).max(180),
  productType: z.enum([
    "STOCKED_PRODUCT",
    "NON_STOCKED_PRODUCT",
    "SERVICE",
    "BUNDLE",
    "RECIPE",
    "SERIALIZED_PRODUCT",
    "BATCH_CONTROLLED_PRODUCT",
    "PERISHABLE_PRODUCT",
  ]),
  categoryId: nullableUuid,
  brandId: nullableUuid,
  taxProfileId: nullableUuid,
  referenceCost: nullableMoney,
  trackInventory: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  idempotencyKey: z.uuid(),
  optionsJson: z.string(),
  variantsJson: z.string(),
});
export const productUpdateSchema = z.object({
  productId: z.uuid(),
  name: z.string().trim().min(1).max(180),
  description: z
    .string()
    .trim()
    .max(4000)
    .optional()
    .transform((v) => v || null),
  categoryId: nullableUuid,
  brandId: nullableUuid,
  taxProfileId: nullableUuid,
  referenceCost: nullableMoney,
});
