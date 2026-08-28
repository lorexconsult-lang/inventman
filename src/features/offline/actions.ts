"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOrganizationPermission } from "@/features/organizations/context";

const go = (error?: string): never =>
  redirect(
    error
      ? `/dashboard/settings/offline?error=${encodeURIComponent(error)}`
      : "/dashboard/settings/offline?saved=1",
  );

export async function manageOfflineDevice(form: FormData) {
  const parsed = z
    .object({
      deviceId: z.string().uuid(),
      label: z.string().trim().min(2).max(100),
      status: z.enum(["ACTIVE", "REVOKED"]),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return go("Invalid device update");
  const { client, organization } = await requireOrganizationPermission(
    "offline.devices.manage",
  );
  const { error } = await client.rpc("manage_offline_device" as never, {
    target_organization_id: organization.id,
    target_device_id: parsed.data.deviceId,
    target_label: parsed.data.label,
    target_status: parsed.data.status,
  } as never);
  if (error) go(error.message);
  revalidatePath("/dashboard/settings/offline");
  go();
}

export async function updateOfflineSettings(form: FormData) {
  const parsed = z
    .object({
      offlineEnabled: z.string().optional(),
      pricePolicy: z.enum(["STRICT", "ALLOW_STALE_WITH_WARNING", "ALLOW_STALE"]),
      stockPolicy: z.enum([
        "BLOCK_IF_LOCAL_SNAPSHOT_INSUFFICIENT",
        "ALLOW_WITH_WARNING",
      ]),
      creditAllowed: z.string().optional(),
      cardAllowed: z.string().optional(),
      transferAllowed: z.string().optional(),
      maxAgeHours: z.coerce.number().int().min(1).max(720),
      retentionDays: z.coerce.number().int().min(1).max(365),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return go("Invalid offline settings");
  const { client, organization } = await requireOrganizationPermission(
    "offline.settings.manage",
  );
  const { error } = await client.rpc("update_offline_settings" as never, {
    target_organization_id: organization.id,
    target_offline_enabled: parsed.data.offlineEnabled === "on",
    target_price_policy: parsed.data.pricePolicy,
    target_stock_policy: parsed.data.stockPolicy,
    target_credit_allowed: parsed.data.creditAllowed === "on",
    target_card_allowed: parsed.data.cardAllowed === "on",
    target_transfer_allowed: parsed.data.transferAllowed === "on",
    target_cache_max_age_hours: parsed.data.maxAgeHours,
    target_history_retention_days: parsed.data.retentionDays,
  } as never);
  if (error) go(error.message);
  revalidatePath("/dashboard/settings/offline");
  go();
}
