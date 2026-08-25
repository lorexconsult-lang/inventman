"use server";

import { revalidatePath } from "next/cache";
import { requireOrganizationPermission } from "@/features/organizations/context";
import {
  branchSchema,
  storageLocationSchema,
  warehouseSchema,
} from "./schemas";

export type LocationActionState = { error?: string; success?: string };

export async function createBranch(
  _: LocationActionState,
  formData: FormData,
): Promise<LocationActionState> {
  const input = branchSchema.safeParse(Object.fromEntries(formData));
  if (!input.success)
    return { error: input.error.issues[0]?.message ?? "Check branch details" };
  const { client, user, organization, business } =
    await requireOrganizationPermission("branches.create");
  const { error } = await client.from("branches").insert({
    organization_id: organization.id,
    business_id: business.id,
    created_by: user.id,
    name: input.data.name,
    code: input.data.code,
    phone: input.data.phone,
    email: input.data.email,
    address_line_1: input.data.addressLine1,
    address_line_2: input.data.addressLine2,
    city: input.data.city,
    region: input.data.region,
    postal_code: input.data.postalCode,
    country_code: input.data.countryCode,
    timezone: input.data.timezone,
  });
  if (error)
    return {
      error:
        error.code === "23505"
          ? "Branch code is already in use"
          : "Branch creation failed",
    };
  revalidatePath("/dashboard/branches");
  return { success: "Branch created" };
}

export async function updateBranch(
  branchId: string,
  _: LocationActionState,
  formData: FormData,
): Promise<LocationActionState> {
  const input = branchSchema.safeParse(Object.fromEntries(formData));
  if (!input.success)
    return { error: input.error.issues[0]?.message ?? "Check branch details" };
  const { client, organization } =
    await requireOrganizationPermission("branches.update");
  const { data, error } = await client
    .from("branches")
    .update({
      name: input.data.name,
      code: input.data.code,
      phone: input.data.phone,
      email: input.data.email,
      address_line_1: input.data.addressLine1,
      address_line_2: input.data.addressLine2,
      city: input.data.city,
      region: input.data.region,
      postal_code: input.data.postalCode,
      country_code: input.data.countryCode,
      timezone: input.data.timezone,
    })
    .eq("id", branchId)
    .eq("organization_id", organization.id)
    .select("id");
  if (error || !data?.length)
    return { error: "Branch update was not authorized" };
  revalidatePath(`/dashboard/branches/${branchId}`);
  revalidatePath("/dashboard/branches");
  return { success: "Branch updated" };
}

export async function setBranchStatus(
  branchId: string,
  status: "active" | "inactive",
): Promise<void> {
  const { client, organization } = await requireOrganizationPermission(
    status === "inactive" ? "branches.deactivate" : "branches.update",
  );
  const { error } = await client
    .from("branches")
    .update({ status })
    .eq("id", branchId)
    .eq("organization_id", organization.id);
  if (error) throw new Error("Branch status change failed");
  revalidatePath("/dashboard/branches");
  revalidatePath(`/dashboard/branches/${branchId}`);
}

export async function createWarehouse(
  _: LocationActionState,
  formData: FormData,
): Promise<LocationActionState> {
  const input = warehouseSchema.safeParse(Object.fromEntries(formData));
  if (!input.success)
    return {
      error: input.error.issues[0]?.message ?? "Check warehouse details",
    };
  const { client } = await requireOrganizationPermission("warehouses.create");
  const { error } = await client.rpc("create_warehouse", {
    target_branch_id: input.data.branchId,
    warehouse_name: input.data.name,
    warehouse_code: input.data.code,
    target_warehouse_type: input.data.warehouseType,
    warehouse_description: input.data.description ?? "",
    make_default: input.data.isDefault,
  });
  if (error)
    return {
      error:
        error.code === "23505"
          ? "Warehouse code or default already exists"
          : "Warehouse creation failed",
    };
  revalidatePath(`/dashboard/branches/${input.data.branchId}`);
  revalidatePath("/dashboard/warehouses");
  return { success: "Warehouse and root location created" };
}

export async function createStorageLocation(
  _: LocationActionState,
  formData: FormData,
): Promise<LocationActionState> {
  const input = storageLocationSchema.safeParse(Object.fromEntries(formData));
  if (!input.success)
    return {
      error: input.error.issues[0]?.message ?? "Check location details",
    };
  const { client, user, organization } = await requireOrganizationPermission(
    "storage_locations.create",
  );
  const { error } = await client.from("storage_locations").insert({
    organization_id: organization.id,
    branch_id: input.data.branchId,
    warehouse_id: input.data.warehouseId,
    parent_location_id: input.data.parentLocationId,
    name: input.data.name,
    code: input.data.code,
    location_type: input.data.locationType,
    description: input.data.description,
    created_by: user.id,
  });
  if (error)
    return {
      error:
        error.code === "23505"
          ? "Location code already exists in this warehouse"
          : "Storage location creation failed",
    };
  revalidatePath(`/dashboard/warehouses/${input.data.warehouseId}`);
  return { success: "Storage location created" };
}

export async function setWarehouseStatus(
  warehouseId: string,
  status: "active" | "inactive",
): Promise<void> {
  const { client, organization } = await requireOrganizationPermission(
    status === "inactive" ? "warehouses.deactivate" : "warehouses.update",
  );
  const { error } = await client
    .from("warehouses")
    .update({ status })
    .eq("id", warehouseId)
    .eq("organization_id", organization.id);
  if (error) throw new Error("Warehouse status change failed");
  revalidatePath("/dashboard/warehouses");
  revalidatePath(`/dashboard/warehouses/${warehouseId}`);
}

export async function setStorageLocationStatus(
  locationId: string,
  active: boolean,
): Promise<void> {
  const { client, organization } = await requireOrganizationPermission(
    active ? "storage_locations.update" : "storage_locations.deactivate",
  );
  const { error } = await client
    .from("storage_locations")
    .update({ is_active: active })
    .eq("id", locationId)
    .eq("organization_id", organization.id);
  if (error) throw new Error("Storage location status change failed");
  revalidatePath("/dashboard/warehouses");
}

export async function updateWarehouse(
  warehouseId: string,
  _: LocationActionState,
  formData: FormData,
): Promise<LocationActionState> {
  const input = warehouseSchema.safeParse(Object.fromEntries(formData));
  if (!input.success)
    return {
      error: input.error.issues[0]?.message ?? "Check warehouse details",
    };
  const { client, organization } =
    await requireOrganizationPermission("warehouses.update");
  const { error } = await client
    .from("warehouses")
    .update({
      name: input.data.name,
      code: input.data.code,
      warehouse_type: input.data.warehouseType,
      description: input.data.description,
    })
    .eq("id", warehouseId)
    .eq("organization_id", organization.id);
  if (error)
    return {
      error:
        error.code === "23505"
          ? "Warehouse code is already in use"
          : "Warehouse update failed",
    };
  if (input.data.isDefault) {
    const { error: defaultError } = await client.rpc("set_default_warehouse", {
      target_organization_id: organization.id,
      target_branch_id: input.data.branchId,
      target_warehouse_id: warehouseId,
    });
    if (defaultError)
      return { error: "Warehouse saved, but default selection failed" };
  }
  revalidatePath(`/dashboard/warehouses/${warehouseId}`);
  revalidatePath("/dashboard/warehouses");
  return { success: "Warehouse updated" };
}
