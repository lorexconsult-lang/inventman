import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getOrganizationContext } from "@/features/organizations/context";
import { salesPermissions } from "@/features/sales/queries";
export default async function Customers({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    type?: string;
    page?: string;
  }>;
}) {
  const p = await searchParams,
    page = Math.max(Number(p.page) || 1, 1),
    size = 25,
    from = (page - 1) * size;
  const { client, organization } = await getOrganizationContext();
  const permissions = await salesPermissions();
  let req = client
    .from("customers")
    .select(
      "id,customer_code,display_name,customer_type,status,credit_limit,credit_status,email,phone",
      { count: "exact" },
    )
    .eq("organization_id", organization.id)
    .order("display_name")
    .range(from, from + size - 1);
  if (p.q)
    req = req.or(
      `display_name.ilike.%${p.q}%,customer_code.ilike.%${p.q}%,email.ilike.%${p.q}%`,
    );
  if (p.status) req = req.eq("status", p.status);
  if (p.type) req = req.eq("customer_type", p.type);
  const { data, count, error } = await req;
  const ids = (data ?? []).map((x) => x.id);
  const { data: exposure } =
    permissions["receivables.view"] && ids.length
      ? await client
          .from("customer_credit_exposure")
          .select("customer_id,exposure_base")
          .in("customer_id", ids)
      : { data: [] };
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Sales"
        title="Customers"
        description="Customer master, credit status and receivable exposure."
        actions={
          <Link
            href="/dashboard/sales/customers/new"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white"
          >
            New customer
          </Link>
        }
      />
      <form className="grid gap-3 rounded-xl border bg-surface p-4 sm:grid-cols-4">
        <input
          name="q"
          defaultValue={p.q}
          placeholder="Search name, code or email"
          className="min-h-11 rounded-xl border px-3 sm:col-span-2"
        />
        <select
          name="status"
          defaultValue={p.status}
          className="min-h-11 rounded-xl border px-3"
        >
          <option value="">All statuses</option>
          {["ACTIVE", "INACTIVE", "BLOCKED", "ARCHIVED"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select
          name="type"
          defaultValue={p.type}
          className="min-h-11 rounded-xl border px-3"
        >
          <option value="">All types</option>
          <option>BUSINESS</option>
          <option>INDIVIDUAL</option>
        </select>
        <button className="rounded-xl bg-ink px-4 py-2 text-white">
          Filter
        </button>
      </form>
      {error ? (
        <p className="rounded-xl border border-red-300 p-4">
          Customers could not be loaded.
        </p>
      ) : !data?.length ? (
        <EmptyState
          title="No customers found"
          description="Create a customer or adjust the filters."
        />
      ) : (
        <div className="grid gap-3">
          {data.map((x) => {
            const used = Number(
              exposure?.find((e) => e.customer_id === x.id)?.exposure_base ?? 0,
            );
            return (
              <Link
                href={`/dashboard/sales/customers/${x.id}`}
                key={x.id}
                className="grid gap-2 rounded-xl border bg-surface p-4 md:grid-cols-[1fr_auto]"
              >
                <div>
                  <strong>
                    {x.customer_code} · {x.display_name}
                  </strong>
                  <p className="text-sm text-subtle">
                    {x.customer_type} ·{" "}
                    {x.email || x.phone || "No primary contact"}
                  </p>
                </div>
                <div className="text-sm md:text-right">
                  <span>
                    {x.status} · {x.credit_status}
                  </span>
                  {permissions["receivables.view"] && (
                    <p className="text-subtle">
                      Exposure {used.toLocaleString()} · available{" "}
                      {Math.max(
                        Number(x.credit_limit) - used,
                        0,
                      ).toLocaleString()}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <nav className="flex justify-between">
        <Link
          aria-disabled={page === 1}
          href={`?${new URLSearchParams({ ...p, page: String(Math.max(1, page - 1)) })}`}
          className="rounded-lg border px-3 py-2"
        >
          Previous
        </Link>
        <span>
          Page {page} · {count ?? 0} customers
        </span>
        <Link
          aria-disabled={from + size >= (count ?? 0)}
          href={`?${new URLSearchParams({ ...p, page: String(page + 1) })}`}
          className="rounded-lg border px-3 py-2"
        >
          Next
        </Link>
      </nav>
    </div>
  );
}
