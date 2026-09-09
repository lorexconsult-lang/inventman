"use server";

import { revalidatePath } from "next/cache";
import type { Json } from "@/types/database.generated";
import { requireOrganizationPermission } from "@/features/organizations/context";
import {
  barcodeSchema,
  brandSchema,
  categorySchema,
  packagingSchema,
  priceListSchema,
  productPriceSchema,
  productUpdateSchema,
  simpleProductSchema,
  taxSchema,
  unitSchema,
  variantProductSchema,
} from "./schemas";
import { validateCatalogueCsv, type CatalogueCsvRow } from "./csv";

export type CatalogueActionState = {
  error?: string;
  success?: string;
  productId?: string;
  summary?: string;
};
const invalid = (
  message = "Check the submitted details",
): CatalogueActionState => ({ error: message });

function catalogueRpcError(
  message: string | null | undefined,
  fallback: string,
) {
  switch (message?.toLowerCase()) {
    case "permission_denied":
      return "You do not have permission to create products in this organization.";
    case "price_permission_denied":
      return "You can create products, but you do not have permission to add selling prices.";
    case "invalid_base_unit":
      return "Select an active base unit before creating the product.";
    case "feature_not_included":
      return "Product catalogue access is not enabled for this organization.";
    case "tenant_suspended":
      return "This organization is currently suspended.";
    default:
      return fallback;
  }
}

export async function createCategory(
  _: CatalogueActionState,
  formData: FormData,
): Promise<CatalogueActionState> {
  const input = categorySchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return invalid(input.error.issues[0]?.message);
  const { client, user, organization } =
    await requireOrganizationPermission("categories.manage");
  const { error } = await client.from("product_categories").insert({
    organization_id: organization.id,
    created_by: user.id,
    name: input.data.name,
    slug: input.data.slug,
    parent_id: input.data.parentId,
    description: input.data.description,
  });
  if (error)
    return invalid(
      error.code === "23505"
        ? "Category slug already exists"
        : "Category creation failed",
    );
  revalidatePath("/dashboard/catalogue/settings");
  return { success: "Category created" };
}
export async function createBrand(
  _: CatalogueActionState,
  formData: FormData,
): Promise<CatalogueActionState> {
  const input = brandSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return invalid(input.error.issues[0]?.message);
  const { client, user, organization } =
    await requireOrganizationPermission("brands.manage");
  const { error } = await client.from("brands").insert({
    organization_id: organization.id,
    created_by: user.id,
    ...input.data,
  });
  if (error)
    return invalid(
      error.code === "23505" ? "Brand already exists" : "Brand creation failed",
    );
  revalidatePath("/dashboard/catalogue/settings");
  return { success: "Brand created" };
}
export async function createUnit(
  _: CatalogueActionState,
  formData: FormData,
): Promise<CatalogueActionState> {
  const input = unitSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return invalid(input.error.issues[0]?.message);
  const { client, user, organization } =
    await requireOrganizationPermission("units.manage");
  const { error } = await client.from("units_of_measure").insert({
    organization_id: organization.id,
    created_by: user.id,
    ...input.data,
  });
  if (error)
    return invalid(
      error.code === "23505"
        ? "Unit name or symbol already exists"
        : "Unit creation failed",
    );
  revalidatePath("/dashboard/catalogue/settings");
  return { success: "Unit created" };
}
export async function createTaxProfile(
  _: CatalogueActionState,
  formData: FormData,
): Promise<CatalogueActionState> {
  const input = taxSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return invalid(input.error.issues[0]?.message);
  const { client, user, organization } =
    await requireOrganizationPermission("taxes.manage");
  const rate = input.data.taxTreatment === "STANDARD" ? input.data.rate : 0;
  const { error } = await client.from("tax_profiles").insert({
    organization_id: organization.id,
    created_by: user.id,
    name: input.data.name,
    code: input.data.code,
    rate,
    calculation: input.data.calculation,
    tax_treatment: input.data.taxTreatment,
  });
  if (error) return invalid("Tax profile creation failed");
  revalidatePath("/dashboard/catalogue/settings");
  return { success: "Tax profile created" };
}
export async function createPriceList(
  _: CatalogueActionState,
  formData: FormData,
): Promise<CatalogueActionState> {
  const input = priceListSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return invalid(input.error.issues[0]?.message);
  const { client, user, organization } =
    await requireOrganizationPermission("prices.manage");
  const { data, error } = await client
    .from("price_lists")
    .insert({
      organization_id: organization.id,
      created_by: user.id,
      name: input.data.name,
      code: input.data.code,
      description: input.data.description,
      currency_code: input.data.currencyCode,
      is_default: false,
    })
    .select("id")
    .single();
  if (error) return invalid("Price list creation failed");
  if (input.data.isDefault) {
    const { error: defaultError } = await client.rpc("set_default_price_list", {
      target_organization_id: organization.id,
      target_price_list_id: data.id,
    });
    if (defaultError)
      return invalid("Price list created, but default selection failed");
  }
  revalidatePath("/dashboard/catalogue/settings");
  return { success: "Price list created" };
}
export async function createSimpleProduct(
  _: CatalogueActionState,
  formData: FormData,
): Promise<CatalogueActionState> {
  const input = simpleProductSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return invalid(input.error.issues[0]?.message);
  const { client, organization, business } =
    await requireOrganizationPermission("products.create");
  const track =
    input.data.productType === "SERVICE" ? false : input.data.trackInventory;
  const { data, error } = await client.rpc("create_simple_product", {
    target_organization_id: organization.id,
    target_business_id: business.id,
    product_name: input.data.name,
    target_product_type: input.data.productType,
    target_category_id: input.data.categoryId,
    target_brand_id: input.data.brandId,
    target_tax_profile_id: input.data.taxProfileId,
    target_unit_id: input.data.unitId,
    target_sku: input.data.sku,
    target_barcode: input.data.barcode,
    target_price_list_id: input.data.priceListId,
    target_price: input.data.price,
    target_reference_cost: input.data.referenceCost,
    target_reorder_point: input.data.reorderPoint,
    target_track_inventory: track,
    target_idempotency_key: input.data.idempotencyKey,
  } as never);
  if (error)
    return invalid(
      error.code === "23505"
        ? "SKU, barcode, or request has already been used"
        : catalogueRpcError(error.message, "Product creation failed"),
    );
  revalidatePath("/dashboard/catalogue");
  return { success: "Product created", productId: data };
}
export async function createVariantProduct(
  _: CatalogueActionState,
  formData: FormData,
): Promise<CatalogueActionState> {
  const input = variantProductSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return invalid(input.error.issues[0]?.message);
  let options: Json, variants: Json;
  try {
    options = JSON.parse(input.data.optionsJson) as Json;
    variants = JSON.parse(input.data.variantsJson) as Json;
  } catch {
    return invalid("Variant configuration is malformed");
  }
  const { client, organization, business } =
    await requireOrganizationPermission("products.create");
  const { data, error } = await client.rpc("create_variant_product", {
    target_organization_id: organization.id,
    target_business_id: business.id,
    product_name: input.data.name,
    target_product_type: input.data.productType,
    target_category_id: input.data.categoryId,
    target_brand_id: input.data.brandId,
    target_tax_profile_id: input.data.taxProfileId,
    target_track_inventory:
      input.data.productType === "SERVICE" ? false : input.data.trackInventory,
    target_reference_cost: input.data.referenceCost,
    target_idempotency_key: input.data.idempotencyKey,
    option_definitions: options,
    variant_definitions: variants,
  } as never);
  if (error)
    return invalid(
      error.code === "23505"
        ? "A SKU or variant combination is duplicated"
        : catalogueRpcError(error.message, "Variant product creation failed"),
    );
  revalidatePath("/dashboard/catalogue");
  return { success: "Variant product created", productId: data };
}
export async function addPackaging(
  _: CatalogueActionState,
  formData: FormData,
): Promise<CatalogueActionState> {
  const input = packagingSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return invalid(input.error.issues[0]?.message);
  const { client, organization } =
    await requireOrganizationPermission("products.update");
  const { error } = await client.from("product_variant_packaging").insert({
    organization_id: organization.id,
    product_variant_id: input.data.variantId,
    unit_of_measure_id: input.data.unitId,
    name: input.data.name,
    conversion_to_base: input.data.conversionToBase,
    is_base_unit: false,
    can_purchase: input.data.canPurchase,
    can_sell: input.data.canSell,
  });
  if (error) return invalid("Packaging creation failed");
  revalidatePath("/dashboard/catalogue");
  return { success: "Packaging added" };
}
export async function addBarcode(
  _: CatalogueActionState,
  formData: FormData,
): Promise<CatalogueActionState> {
  const input = barcodeSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return invalid(input.error.issues[0]?.message);
  const { client, organization } =
    await requireOrganizationPermission("products.update");
  const { error } = await client.from("product_barcodes").insert({
    organization_id: organization.id,
    product_variant_id: input.data.variantId,
    packaging_id: input.data.packagingId,
    barcode: input.data.barcode,
    barcode_type: input.data.barcodeType,
    is_primary: input.data.isPrimary,
  });
  if (error)
    return invalid(
      error.code === "23505"
        ? "Barcode already exists"
        : "Barcode creation failed",
    );
  revalidatePath("/dashboard/catalogue");
  return { success: "Barcode added" };
}
export async function addProductPrice(
  _: CatalogueActionState,
  formData: FormData,
): Promise<CatalogueActionState> {
  const input = productPriceSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return invalid(input.error.issues[0]?.message);
  const { client, user, organization } =
    await requireOrganizationPermission("prices.manage");
  const { error } = await client.from("product_prices").insert({
    organization_id: organization.id,
    created_by: user.id,
    product_variant_id: input.data.variantId,
    packaging_id: input.data.packagingId,
    price_list_id: input.data.priceListId,
    branch_id: input.data.branchId,
    min_quantity: input.data.minQuantity,
    amount: input.data.amount,
  });
  if (error) return invalid("Price creation failed");
  revalidatePath("/dashboard/catalogue");
  return { success: "Price added" };
}
export async function setProductStatus(
  productId: string,
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED",
): Promise<void> {
  const permission =
    status === "ARCHIVED" ? "products.archive" : "products.update";
  const { client, organization } =
    await requireOrganizationPermission(permission);
  const { error } = await client
    .from("products")
    .update({
      status,
      archived_at: status === "ARCHIVED" ? new Date().toISOString() : null,
    })
    .eq("id", productId)
    .eq("organization_id", organization.id);
  if (error) throw new Error("Product status change failed");
  revalidatePath("/dashboard/catalogue");
  revalidatePath(`/dashboard/catalogue/${productId}`);
}

export async function updateProduct(
  _: CatalogueActionState,
  formData: FormData,
): Promise<CatalogueActionState> {
  const input = productUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return invalid(input.error.issues[0]?.message);
  const { client, organization } =
    await requireOrganizationPermission("products.update");
  const { error } = await client
    .from("products")
    .update({
      name: input.data.name,
      description: input.data.description,
      category_id: input.data.categoryId,
      brand_id: input.data.brandId,
      tax_profile_id: input.data.taxProfileId,
      reference_cost: input.data.referenceCost,
    })
    .eq("id", input.data.productId)
    .eq("organization_id", organization.id);
  if (error) return invalid("Product update failed");
  revalidatePath(`/dashboard/catalogue/${input.data.productId}`);
  revalidatePath("/dashboard/catalogue");
  return { success: "Product updated" };
}

export async function setSetupStatus(
  table:
    | "product_categories"
    | "brands"
    | "units_of_measure"
    | "tax_profiles"
    | "price_lists",
  id: string,
  active: boolean,
): Promise<void> {
  const permission =
    table === "product_categories"
      ? "categories.manage"
      : table === "brands"
        ? "brands.manage"
        : table === "units_of_measure"
          ? "units.manage"
          : table === "tax_profiles"
            ? "taxes.manage"
            : "prices.manage";
  const { client, organization } =
    await requireOrganizationPermission(permission);
  const { error } = await client
    .from(table)
    .update({ is_active: active })
    .eq("id", id)
    .eq("organization_id", organization.id);
  if (error) throw new Error("Catalogue setting update failed");
  revalidatePath("/dashboard/catalogue/settings");
}

export async function uploadProductImage(
  _: CatalogueActionState,
  formData: FormData,
): Promise<CatalogueActionState> {
  const productId = String(formData.get("productId") ?? "");
  const file = formData.get("image");
  if (
    !/^[0-9a-f-]{36}$/i.test(productId) ||
    !(file instanceof File) ||
    !file.size
  )
    return invalid("Choose an image");
  if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type))
    return invalid("Use a JPEG, PNG, or WebP image");
  if (file.size > 5 * 1024 * 1024)
    return invalid("Images must be 5 MB or smaller");
  const { client, user, organization } =
    await requireOrganizationPermission("products.update");
  const { data: product } = await client
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!product) return invalid("Product not found");
  const extension =
    file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const storagePath = `${organization.id}/products/${productId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await client.storage
    .from("product-images")
    .upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) return invalid("Image upload failed");
  const { count } = await client
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  const { error } = await client.from("product_images").insert({
    organization_id: organization.id,
    product_id: productId,
    created_by: user.id,
    storage_path: storagePath,
    mime_type: file.type,
    byte_size: file.size,
    alt_text: String(formData.get("altText") ?? "").trim() || null,
    is_primary: (count ?? 0) === 0,
  });
  if (error) {
    await client.storage.from("product-images").remove([storagePath]);
    return invalid("Image metadata could not be saved");
  }
  revalidatePath(`/dashboard/catalogue/${productId}`);
  return { success: "Image uploaded" };
}

export async function deleteProductImage(
  productId: string,
  imageId: string,
): Promise<void> {
  const { client, organization } =
    await requireOrganizationPermission("products.update");
  const { data } = await client
    .from("product_images")
    .select("storage_path")
    .eq("id", imageId)
    .eq("product_id", productId)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (!data) throw new Error("Image not found");
  const { error } = await client
    .from("product_images")
    .delete()
    .eq("id", imageId)
    .eq("organization_id", organization.id);
  if (error) throw new Error("Image deletion failed");
  await client.storage.from("product-images").remove([data.storage_path]);
  revalidatePath(`/dashboard/catalogue/${productId}`);
}

export async function importCatalogue(
  _: CatalogueActionState,
  formData: FormData,
): Promise<CatalogueActionState> {
  const csv = String(formData.get("csv") ?? "");
  const fileName = String(formData.get("fileName") ?? "catalogue.csv").slice(
    0,
    200,
  );
  if (csv.length > 2_000_000) return invalid("CSV is too large");
  const preview = validateCatalogueCsv(csv);
  if (!preview.length) return invalid("CSV contains no product rows");
  if (preview.length > 500)
    return invalid("Import batches are limited to 500 rows");
  if (preview.some((row) => row.errors.length))
    return invalid("Resolve every validation error before importing");
  const { client, user, organization, business } =
    await requireOrganizationPermission("catalogue.import");
  const [
    { data: categories },
    { data: brands },
    { data: units },
    { data: priceLists },
  ] = await Promise.all([
    client.from("product_categories").select("id,name"),
    client.from("brands").select("id,name"),
    client.from("units_of_measure").select("id,name,symbol"),
    client.from("price_lists").select("id").eq("is_default", true).limit(1),
  ]);
  const categoryMap = new Map(
    (categories ?? []).map((item) => [item.name.toLowerCase(), item.id]),
  );
  const brandMap = new Map(
    (brands ?? []).map((item) => [item.name.toLowerCase(), item.id]),
  );
  const unitMap = new Map(
    (units ?? []).flatMap((item) => [
      [item.name.toLowerCase(), item.id],
      [item.symbol.toLowerCase(), item.id],
    ]),
  );
  const priceListId = priceLists?.[0]?.id ?? null;
  const resolved = preview.map((row) => {
    const data = row.data as CatalogueCsvRow;
    return {
      data,
      categoryId: data.category
        ? (categoryMap.get(data.category.toLowerCase()) ?? null)
        : null,
      brandId: data.brand
        ? (brandMap.get(data.brand.toLowerCase()) ?? null)
        : null,
      unitId: unitMap.get(data.base_unit.toLowerCase()),
    };
  });
  if (
    resolved.some(
      (row) =>
        !row.unitId ||
        (row.data.category && !row.categoryId) ||
        (row.data.brand && !row.brandId),
    )
  )
    return invalid("CSV references an unknown unit, category, or brand");
  const incomingSkus = resolved.map((row) => row.data.sku).filter(Boolean);
  const incomingBarcodes = resolved
    .map((row) => row.data.barcode)
    .filter(Boolean);
  const [{ data: existingSkus }, { data: existingBarcodes }] =
    await Promise.all([
      incomingSkus.length
        ? client.from("product_variants").select("sku").in("sku", incomingSkus)
        : Promise.resolve({ data: [] }),
      incomingBarcodes.length
        ? client
            .from("product_barcodes")
            .select("barcode")
            .in("barcode", incomingBarcodes)
        : Promise.resolve({ data: [] }),
    ]);
  if (existingSkus?.length || existingBarcodes?.length)
    return invalid(
      "CSV contains a SKU or barcode that already exists in this organization",
    );
  const { data: batch, error: batchError } = await client
    .from("catalogue_import_batches")
    .insert({
      organization_id: organization.id,
      created_by: user.id,
      file_name: fileName,
      total_rows: resolved.length,
      valid_rows: resolved.length,
      error_rows: 0,
      status: "PROCESSING",
    })
    .select("id")
    .single();
  if (batchError) return invalid("Could not start import");
  let imported = 0;
  for (const row of resolved) {
    const { error } = await client.rpc("create_simple_product", {
      target_organization_id: organization.id,
      target_business_id: business.id,
      product_name: row.data.product_name,
      target_product_type: row.data.product_type,
      target_category_id: row.categoryId,
      target_brand_id: row.brandId,
      target_tax_profile_id: null,
      target_unit_id: row.unitId!,
      target_sku: row.data.sku,
      target_barcode: row.data.barcode,
      target_price_list_id: priceListId,
      target_price:
        row.data.selling_price === "" ? null : Number(row.data.selling_price),
      target_reference_cost:
        row.data.reference_cost === "" ? null : Number(row.data.reference_cost),
      target_reorder_point:
        row.data.reorder_point === "" ? null : Number(row.data.reorder_point),
      target_track_inventory: row.data.product_type !== "SERVICE",
      target_idempotency_key: crypto.randomUUID(),
    } as never);
    if (error) break;
    imported++;
  }
  const failed = resolved.length - imported;
  await client
    .from("catalogue_import_batches")
    .update({
      status: failed ? "COMPLETED_WITH_ERRORS" : "COMPLETED",
      valid_rows: imported,
      error_rows: failed,
      completed_at: new Date().toISOString(),
    })
    .eq("id", batch.id);
  revalidatePath("/dashboard/catalogue");
  return {
    success: failed ? "Import completed with errors" : "Import completed",
    summary: `${imported} imported, ${failed} failed`,
  };
}
