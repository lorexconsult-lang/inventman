import Link from "next/link";
import { finishCommercialOnboarding } from "@/features/onboarding/actions";
import { getEntitledFeatures, getOrganizationContext } from "@/features/organizations/context";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const { client, organization } = await getOrganizationContext();
  const [branches, warehouses, products, terminals, teammates, features] = await Promise.all([
    client.from("branches").select("id", { count: "exact", head: true }).eq("organization_id", organization.id).eq("status", "active"),
    client.from("warehouses").select("id", { count: "exact", head: true }).eq("organization_id", organization.id).eq("status", "active"),
    client.from("products").select("id", { count: "exact", head: true }).eq("organization_id", organization.id).neq("status", "ARCHIVED"),
    client.from("pos_terminals").select("id", { count: "exact", head: true }).eq("organization_id", organization.id).eq("status", "ACTIVE"),
    client.from("organization_members").select("id", { count: "exact", head: true }).eq("organization_id", organization.id).in("status", ["active", "invited"]),
    getEntitledFeatures(organization.id),
  ]);
  const branchReady = Boolean(branches.count), warehouseReady = Boolean(warehouses.count), productReady = Boolean(products.count), posIncluded = features.has("pos"), posReady = Boolean(terminals.count), teamReady = (teammates.count ?? 0) > 1;
  const current = !branchReady ? 2 : !warehouseReady ? 3 : 4;
  return <main className="section"><p className="eyebrow">Business setup · Step {current} of 7</p><h1 className="text-4xl font-semibold">Prepare {organization.name} for its first working day.</h1><p className="mt-3 text-subtle">Progress is reconciled from your real business records, so refreshes and retries do not create duplicates.</p><div className="mt-8 feature-grid"><Step n="1" title="Business profile" done body="Organization, owner access and trial are ready."/><Step n="2" title="First branch" done={branchReady} body={branchReady?"An active branch is ready.":"Create the location your team operates from."} href="/dashboard/branches/new" action="Create branch"/><Step n="3" title="Warehouse" done={warehouseReady} body={warehouseReady?"An active stock location is ready.":branchReady?"Create Main Warehouse using the existing location workflow.":"Complete the branch step first."} href={branchReady?"/dashboard/warehouses":undefined} action="Create warehouse"/><Step n="4" title="Inventory" done={productReady} body={productReady?"Your catalogue has started.":"Add a product, import CSV, or continue for now."} href="/dashboard/catalogue/new" action="Add product" extra="/dashboard/catalogue/import"/><Step n="5" title="POS" done={posReady} body={posIncluded?(posReady?"An active terminal is ready.":"Set up POS now or later."):"POS is not included in your current plan."} href={posIncluded?"/dashboard/settings/pos":"/pricing"} action={posIncluded?"Set up POS":"View plans"}/><Step n="6" title="Team" done={teamReady} body={teamReady?"Your team has more than one member.":"Invite a teammate now or later."} href="/dashboard/settings/team/invite" action="Invite teammate"/></div><section className="notice mt-8"><p className="eyebrow">Step 7 of 7</p><h2>Finish initial setup</h2><p>Entering the workspace does not mark optional inventory, POS, team or Finance work as complete.</p><form action={finishCommercialOnboarding}><button className="public-button">Enter Inventman</button></form></section></main>
}
function Step({n,title,done,body,href,action,extra}:{n:string;title:string;done:boolean;body:string;href?:string;action?:string;extra?:string}){return <article><p className="eyebrow">Step {n} {done?"· Complete":""}</p><h2>{title}</h2><p>{body}</p>{!done&&href&&<p><Link className="text-link" href={href}>{action} →</Link>{extra&&<> · <Link href={extra}>Import CSV</Link></>}</p>}</article>}
