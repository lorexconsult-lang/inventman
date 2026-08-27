import { ActionFeedback } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { createTerminal, updatePosSettings } from "@/features/pos/actions";
import { requireOrganizationPermission } from "@/features/organizations/context";

export default async function PosSettings({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; terminal?: string }>;
}) {
  const [{ client, organization }, query] = await Promise.all([
    requireOrganizationPermission("pos.terminal.manage"),
    searchParams,
  ]);
  const [
    { data: settings },
    { data: terminals },
    { data: branches },
    { data: warehouses },
    { data: locations },
    { data: customers },
    { data: accounts },
  ] = await Promise.all([
    client
      .from("pos_settings")
      .select("*")
      .eq("organization_id", organization.id)
      .single(),
    client
      .from("pos_terminals")
      .select(
        "*,branches(name),warehouses(name),storage_locations(name),payment_accounts(name)",
      )
      .order("name"),
    client
      .from("branches")
      .select("id,name")
      .eq("status", "active")
      .order("name"),
    client
      .from("warehouses")
      .select("id,name,branch_id")
      .eq("status", "active")
      .order("name"),
    client
      .from("storage_locations")
      .select("id,name,warehouse_id")
      .eq("is_active", true)
      .order("name"),
    client
      .from("customers")
      .select("id,display_name")
      .eq("status", "ACTIVE")
      .order("display_name")
      .limit(500),
    client
      .from("payment_accounts")
      .select("id,name,branch_id,currency")
      .eq("status", "ACTIVE")
      .eq("account_type", "CASH")
      .order("name"),
  ]);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Settings"
        title="Point of sale"
        description="Configure terminals, walk-in policy, discounts, held carts, receipts, and cash variance controls."
      />
      <ActionFeedback
        error={query.error}
        success={
          query.saved
            ? "POS settings saved."
            : query.terminal
              ? "Terminal created."
              : undefined
        }
      />
      <section className="grid gap-6 xl:grid-cols-2">
        <form
          action={updatePosSettings}
          className="space-y-4 rounded-2xl border bg-surface p-5"
        >
          <h2 className="font-semibold">Register policy</h2>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="allowWalkIn"
                defaultChecked={settings?.allow_walk_in}
              />{" "}
              Allow walk-in customer
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="requireCustomer"
                defaultChecked={settings?.require_customer}
              />{" "}
              Require named customer
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="allowDiscounts"
                defaultChecked={settings?.allow_discounts}
              />{" "}
              Allow discounts
            </label>
            <label>
              Discount threshold %
              <input
                name="discountThreshold"
                type="number"
                min="0"
                max="100"
                step="0.01"
                defaultValue={settings?.discount_threshold_percent ?? 10}
                className="mt-1 min-h-10 w-full rounded-lg border px-3"
              />
            </label>
            <label>
              Cash variance tolerance
              <input
                name="varianceTolerance"
                type="number"
                min="0"
                step="0.01"
                defaultValue={settings?.cash_variance_tolerance ?? 0}
                className="mt-1 min-h-10 w-full rounded-lg border px-3"
              />
            </label>
            <label>
              Held-cart expiry (minutes)
              <input
                name="holdMinutes"
                type="number"
                min="5"
                max="10080"
                defaultValue={settings?.hold_expiration_minutes ?? 1440}
                className="mt-1 min-h-10 w-full rounded-lg border px-3"
              />
            </label>
          </div>
          <label className="block text-sm">
            Return policy
            <textarea
              name="returnPolicy"
              defaultValue={settings?.return_policy ?? ""}
              className="mt-1 min-h-24 w-full rounded-lg border p-3"
            />
          </label>
          <Button>Save settings</Button>
        </form>
        <form
          action={createTerminal}
          className="grid gap-3 rounded-2xl border bg-surface p-5"
        >
          <h2 className="font-semibold">Add terminal</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="code"
              required
              className="min-h-11 rounded-xl border px-3"
              placeholder="Terminal code"
            />
            <input
              name="name"
              required
              className="min-h-11 rounded-xl border px-3"
              placeholder="Terminal name"
            />
            <select
              name="branchId"
              required
              className="min-h-11 rounded-xl border px-3"
            >
              <option value="">Branch</option>
              {branches?.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
            <select
              name="warehouseId"
              required
              className="min-h-11 rounded-xl border px-3"
            >
              <option value="">Warehouse</option>
              {warehouses?.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
            <select
              name="locationId"
              required
              className="min-h-11 rounded-xl border px-3"
            >
              <option value="">Stock location</option>
              {locations?.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
            <select
              name="customerId"
              className="min-h-11 rounded-xl border px-3"
            >
              <option value="">No walk-in default</option>
              {customers?.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.display_name}
                </option>
              ))}
            </select>
            <select
              name="accountId"
              required
              className="min-h-11 rounded-xl border px-3"
            >
              <option value="">Cash account</option>
              {accounts?.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name} · {x.currency}
                </option>
              ))}
            </select>
            <select
              name="receiptWidth"
              defaultValue="80MM"
              className="min-h-11 rounded-xl border px-3"
            >
              <option>58MM</option>
              <option>80MM</option>
              <option>A4</option>
            </select>
          </div>
          <textarea
            name="receiptFooter"
            className="rounded-xl border p-3"
            placeholder="Receipt footer"
          />
          <Button>Create terminal</Button>
        </form>
      </section>
      <section>
        <h2 className="mb-3 font-semibold">Terminals</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {terminals?.map((t) => (
            <article key={t.id} className="rounded-xl border bg-surface p-4">
              <div className="flex justify-between">
                <strong>
                  {t.name} · {t.terminal_code}
                </strong>
                <span className="text-xs font-semibold">{t.status}</span>
              </div>
              <p className="mt-2 text-sm text-subtle">
                {t.branches?.name} · {t.warehouses?.name} ·{" "}
                {t.storage_locations?.name}
              </p>
              <p className="text-sm text-subtle">
                Cash account: {t.payment_accounts?.name}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
