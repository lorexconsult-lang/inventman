import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ContactForm, AddressForm } from "@/features/sales/components/forms";
import { getOrganizationContext } from "@/features/organizations/context";
import { salesPermissions } from "@/features/sales/queries";
export default async function CustomerDetail({
  params,
  searchParams,
}: {
  params: Promise<{ customerId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const id = (await params).customerId,
    tab = (await searchParams).tab ?? "overview";
  const { client } = await getOrganizationContext();
  const permissions = await salesPermissions();
  const { data: customer } = await client
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!customer) notFound();
  const tabs = [
    "overview",
    "contacts",
    "addresses",
    "quotations",
    "orders",
    "fulfilments",
    "invoices",
    "returns",
    "credit-notes",
    "receivables",
    "statement",
    "documents",
    "activity",
  ];
  let items: unknown[] = [];
  if (tab === "contacts")
    items =
      (
        await client
          .from("customer_contacts")
          .select("*")
          .eq("customer_id", id)
          .order("is_primary", { ascending: false })
          .limit(25)
      ).data ?? [];
  if (tab === "addresses")
    items =
      (
        await client
          .from("customer_addresses")
          .select("*")
          .eq("customer_id", id)
          .limit(25)
      ).data ?? [];
  if (tab === "quotations")
    items =
      (
        await client
          .from("sales_quotations")
          .select("quotation_number,status,total,currency,quotation_date")
          .eq("customer_id", id)
          .order("quotation_date", { ascending: false })
          .limit(25)
      ).data ?? [];
  if (tab === "orders")
    items =
      (
        await client
          .from("sales_orders")
          .select("sales_order_number,status,total,currency,order_date")
          .eq("customer_id", id)
          .order("order_date", { ascending: false })
          .limit(25)
      ).data ?? [];
  if (tab === "fulfilments")
    items =
      (
        await client
          .from("sales_fulfillments")
          .select("fulfilment_number,status,fulfilled_at")
          .eq("customer_id", id)
          .order("fulfilled_at", { ascending: false })
          .limit(25)
      ).data ?? [];
  if (tab === "invoices" || tab === "receivables" || tab === "statement")
    items =
      (
        await client
          .from("customer_invoices")
          .select(
            "invoice_number,status,invoice_date,due_date,base_currency_total,credit_note_total_base,amount_paid_base",
          )
          .eq("customer_id", id)
          .order("invoice_date", { ascending: false })
          .limit(25)
      ).data ?? [];
  if (tab === "returns")
    items =
      (
        await client
          .from("sales_returns")
          .select("return_number,status,return_date")
          .eq("customer_id", id)
          .order("return_date", { ascending: false })
          .limit(25)
      ).data ?? [];
  if (tab === "credit-notes")
    items =
      (
        await client
          .from("customer_credit_notes")
          .select("credit_note_number,status,credit_date,base_currency_total")
          .eq("customer_id", id)
          .order("credit_date", { ascending: false })
          .limit(25)
      ).data ?? [];
  if (tab === "documents")
    items =
      (
        await client
          .from("customer_documents")
          .select("file_name,document_type,created_at")
          .eq("customer_id", id)
          .limit(25)
      ).data ?? [];
  if (tab === "activity")
    items =
      (
        await client
          .from("sales_activity")
          .select("action,document_type,created_at")
          .eq("document_id", id)
          .order("created_at", { ascending: false })
          .limit(25)
      ).data ?? [];
  const safeItems = items as Array<Record<string, unknown>>;
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Customer"
        title={customer.display_name}
        description={`${customer.customer_code} · ${customer.customer_type} · ${customer.status} · ${customer.credit_status}`}
        actions={
          <Link
            href={`/dashboard/sales/customers/${id}/edit`}
            className="rounded-xl border px-4 py-2 text-sm font-semibold"
          >
            Edit customer
          </Link>
        }
      />
      <nav className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((x) => (
          <Link
            key={x}
            href={`?tab=${x}`}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${tab === x ? "bg-ink text-white" : "border"}`}
          >
            {x.replace("-", " ")}
          </Link>
        ))}
      </nav>
      {tab === "overview" && (
        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["Email", customer.email || "—"],
            ["Phone", customer.phone || "—"],
            ["Currency", customer.default_currency],
            ["Payment terms", customer.default_payment_terms || "—"],
            [
              "Credit limit",
              permissions["receivables.view"]
                ? customer.credit_limit
                : "Restricted",
            ],
            ["Tax number", customer.tax_number || "—"],
          ].map(([k, v]) => (
            <article key={k} className="rounded-xl border p-4">
              <p className="text-sm text-subtle">{k}</p>
              <p className="mt-2 font-semibold">{v}</p>
            </article>
          ))}
        </section>
      )}
      {tab === "contacts" && <ContactForm customerId={id} />}{" "}
      {tab === "addresses" && <AddressForm customerId={id} />}{" "}
      {!["overview", "contacts", "addresses"].includes(tab) && (
        <section className="space-y-2">
          {safeItems.length ? (
            safeItems.map((x, i) => (
              <article key={i} className="rounded-xl border p-4 text-sm">
                {Object.entries(x).map(([k, v]) => (
                  <span key={k} className="mr-4">
                    <strong>{k.replaceAll("_", " ")}:</strong>{" "}
                    {String(v ?? "—")}
                  </span>
                ))}
              </article>
            ))
          ) : (
            <p className="rounded-xl bg-muted p-5 text-subtle">
              No records in this section.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
