import { z } from "zod";

export const catalogueCsvHeaders = [
  "product_name",
  "sku",
  "barcode",
  "category",
  "brand",
  "base_unit",
  "selling_price",
  "reference_cost",
  "reorder_point",
  "product_type",
] as const;
const rowSchema = z.object({
  product_name: z.string().trim().min(1),
  sku: z.string().trim(),
  barcode: z.string().trim(),
  category: z.string().trim(),
  brand: z.string().trim(),
  base_unit: z.string().trim().min(1),
  selling_price: z
    .string()
    .refine(
      (v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0),
      "Invalid selling price",
    ),
  reference_cost: z
    .string()
    .refine(
      (v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0),
      "Invalid reference cost",
    ),
  reorder_point: z
    .string()
    .refine(
      (v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0),
      "Invalid reorder point",
    ),
  product_type: z.enum([
    "STOCKED_PRODUCT",
    "NON_STOCKED_PRODUCT",
    "SERVICE",
    "BUNDLE",
    "RECIPE",
    "SERIALIZED_PRODUCT",
    "BATCH_CONTROLLED_PRODUCT",
    "PERISHABLE_PRODUCT",
  ]),
});
export type CatalogueCsvRow = z.infer<typeof rowSchema>;
export type CsvPreviewRow = {
  line: number;
  data: Record<string, string>;
  errors: string[];
};

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  row.push(field);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}
export function validateCatalogueCsv(text: string): CsvPreviewRow[] {
  const [headers, ...rows] = parseCsv(text);
  if (!headers) return [];
  const normalized = headers.map((h) => h.trim().toLowerCase());
  const preview = rows.map((cells, index) => {
    const data = Object.fromEntries(
      normalized.map((header, i) => [header, cells[i]?.trim() ?? ""]),
    );
    const errors: string[] = [];
    for (const required of catalogueCsvHeaders)
      if (!(required in data)) errors.push(`Missing column ${required}`);
    const parsed = rowSchema.safeParse(data);
    if (!parsed.success)
      errors.push(...parsed.error.issues.map((issue) => issue.message));
    return { line: index + 2, data, errors };
  });
  const skuCounts = new Map<string, number>();
  const barcodeCounts = new Map<string, number>();
  for (const row of preview) {
    if (row.data.sku)
      skuCounts.set(
        row.data.sku.toLowerCase(),
        (skuCounts.get(row.data.sku.toLowerCase()) ?? 0) + 1,
      );
    if (row.data.barcode)
      barcodeCounts.set(
        row.data.barcode,
        (barcodeCounts.get(row.data.barcode) ?? 0) + 1,
      );
  }
  for (const row of preview) {
    if (row.data.sku && (skuCounts.get(row.data.sku.toLowerCase()) ?? 0) > 1)
      row.errors.push("Duplicate SKU in file");
    if (row.data.barcode && (barcodeCounts.get(row.data.barcode) ?? 0) > 1)
      row.errors.push("Duplicate barcode in file");
  }
  return preview;
}
export function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
