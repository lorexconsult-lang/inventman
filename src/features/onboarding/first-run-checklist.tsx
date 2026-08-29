import Link from "next/link";
import { getEffectivePermissions, getEntitledFeatures, getOrganizationContext } from "@/features/organizations/context";

export async function FirstRunChecklist() {
  const { client, organization } = await getOrganizationContext();
  const permissions = await getEffectivePermissions(organization.id);
  if (!permissions.has("organizations.manage")) return null;
  const features = await getEntitledFeatures(organization.id);
  const userId = (await client.auth.getUser()).data.user?.id ?? "";
  const [products, stock, suppliers, customers, payments, terminals, teammates, finance] = await Promise.all([
    client.from("products").select("id", { count: "exact", head: true }).eq("organization_id", organization.id),
    client.from("inventory_transactions").select("id", { count: "exact", head: true }).eq("organization_id", organization.id).eq("transaction_type", "OPENING_STOCK"),
    client.from("suppliers").select("id", { count: "exact", head: true }).eq("organization_id", organization.id),
    client.from("customers").select("id", { count: "exact", head: true }).eq("organization_id", organization.id),
    client.from("payment_methods").select("id", { count: "exact", head: true }).eq("organization_id", organization.id).eq("status", "ACTIVE"),
    client.from("pos_terminals").select("id", { count: "exact", head: true }).eq("organization_id", organization.id).eq("status", "ACTIVE"),
    client.from("organization_members").select("id", { count: "exact", head: true }).eq("organization_id", organization.id).neq("user_id", userId).in("status", ["active", "invited"]),
    client.from("accounting_settings").select("organization_id", { count: "exact", head: true }).eq("organization_id", organization.id).eq("status", "ACTIVE"),
  ]);
  const tasks = [
    { label: "Add first product", href: "/dashboard/catalogue/new", done: Boolean(products.count) },
    { label: "Record opening stock", href: "/dashboard/inventory/opening", done: Boolean(stock.count) },
    { label: "Add supplier", href: "/dashboard/procurement/suppliers", done: Boolean(suppliers.count) },
    { label: "Add customer", href: "/dashboard/sales/customers/new", done: Boolean(customers.count) },
    { label: "Configure payment method", href: "/dashboard/settings/payments", done: Boolean(payments.count) },
    ...(features.has("pos") ? [{ label: "Set up POS", href: "/dashboard/settings/pos", done: Boolean(terminals.count) }] : []),
    { label: "Invite teammate", href: "/dashboard/settings/team/invite", done: Boolean(teammates.count) },
    ...(features.has("finance") ? [{ label: "Configure Finance", href: "/dashboard/finance/settings", done: Boolean(finance.count) }] : []),
  ];
  const done = tasks.filter(task => task.done).length;
  if (done === tasks.length) return null;
  return <details open className="rounded-2xl border bg-surface p-5"><summary className="cursor-pointer font-semibold">First-run checklist · {done} of {tasks.length} completed</summary><div className="mt-5 grid gap-3 sm:grid-cols-2">{tasks.map(task => <Link key={task.label} href={task.href} className="rounded-xl border p-4 hover:border-accent"><span aria-hidden>{task.done ? "✓" : "○"}</span> {task.label}</Link>)}</div><p className="mt-4 text-xs text-subtle">Collapse this checklist at any time. Collapsing does not change task status.</p></details>;
}
