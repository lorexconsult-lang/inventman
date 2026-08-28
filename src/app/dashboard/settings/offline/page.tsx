import { ActionFeedback } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { requireOrganizationPermission } from "@/features/organizations/context";
import { getEffectivePermissions } from "@/features/organizations/context";
import { manageOfflineDevice, updateOfflineSettings } from "@/features/offline/actions";
import { OfflineManagement } from "@/features/offline/components/offline-management";

export default async function OfflineSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const [{ client, organization }, query] = await Promise.all([
    requireOrganizationPermission("offline.conflicts.view"),
    searchParams,
  ]);
  const permissions = await getEffectivePermissions(organization.id);
  const canManageDevices = permissions.has("offline.devices.manage");
  const canManageSettings = permissions.has("offline.settings.manage");
  const [{ data: devices }, { data: settings }] = await Promise.all([
    client.from("offline_devices" as never).select("*").order("last_seen_at", { ascending: false }),
    client.from("pos_settings").select("*").eq("organization_id", organization.id).single(),
  ]);
  const offlineSettings = settings as (typeof settings & Record<string, unknown>) | null;
  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Settings" title="Offline & Sync" description="Device readiness, durable local transactions, conflicts, and server reconciliation." />
      <ActionFeedback error={query.error} success={query.saved ? "Offline settings saved." : undefined} />
      <OfflineManagement organizationId={organization.id} />
      {canManageSettings ? (
        <form action={updateOfflineSettings} className="grid gap-4 rounded-2xl border bg-surface p-5 md:grid-cols-2">
          <h2 className="md:col-span-2 font-semibold">Offline policy</h2>
          <label className="flex items-center gap-2"><input type="checkbox" name="offlineEnabled" defaultChecked={Boolean(offlineSettings?.offline_enabled)} /> Enable approved offline POS</label>
          <label>Price policy<select name="pricePolicy" defaultValue={String(offlineSettings?.offline_price_policy ?? "ALLOW_STALE_WITH_WARNING")} className="mt-1 min-h-10 w-full rounded-lg border px-3"><option>STRICT</option><option>ALLOW_STALE_WITH_WARNING</option><option>ALLOW_STALE</option></select></label>
          <label>Stock policy<select name="stockPolicy" defaultValue={String(offlineSettings?.offline_stock_policy ?? "BLOCK_IF_LOCAL_SNAPSHOT_INSUFFICIENT")} className="mt-1 min-h-10 w-full rounded-lg border px-3"><option>BLOCK_IF_LOCAL_SNAPSHOT_INSUFFICIENT</option><option>ALLOW_WITH_WARNING</option></select></label>
          <label>Cache max age (hours)<input name="maxAgeHours" type="number" min="1" max="720" defaultValue={Number(offlineSettings?.offline_cache_max_age_hours ?? 24)} className="mt-1 min-h-10 w-full rounded-lg border px-3" /></label>
          <label>Local history retention (days)<input name="retentionDays" type="number" min="1" max="365" defaultValue={Number(offlineSettings?.offline_history_retention_days ?? 30)} className="mt-1 min-h-10 w-full rounded-lg border px-3" /></label>
          <label className="flex items-center gap-2"><input type="checkbox" name="creditAllowed" defaultChecked={Boolean(offlineSettings?.offline_credit_allowed)} /> Allow offline credit (high risk)</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="cardAllowed" defaultChecked={Boolean(offlineSettings?.offline_card_allowed)} /> Allow unverified card records</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="transferAllowed" defaultChecked={Boolean(offlineSettings?.offline_transfer_allowed)} /> Allow unverified transfers</label>
          <div className="md:col-span-2"><Button>Save offline policy</Button></div>
        </form>
      ) : null}
      <section>
        <h2 className="mb-3 font-semibold">Registered devices</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {(devices as unknown as Array<Record<string, unknown>> | null)?.map((device) => (
            <form key={String(device.id)} action={manageOfflineDevice} className="grid gap-3 rounded-xl border bg-surface p-4">
              <input type="hidden" name="deviceId" value={String(device.id)} />
              <input name="label" defaultValue={String(device.label)} readOnly={!canManageDevices} className="rounded-lg border px-3 py-2 font-semibold" />
              <p className="text-xs text-subtle">Last sync: {device.last_successful_sync_at ? new Date(String(device.last_successful_sync_at)).toLocaleString() : "Never"}</p>
              <select name="status" defaultValue={String(device.status)} disabled={!canManageDevices} className="rounded-lg border px-3 py-2"><option>ACTIVE</option><option>REVOKED</option></select>
              {canManageDevices ? <Button>Update device</Button> : null}
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
