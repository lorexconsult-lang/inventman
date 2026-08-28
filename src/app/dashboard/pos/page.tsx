import { ActionFeedback } from "@/components/ui/action-feedback";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { PosRegister } from "@/features/pos/components/pos-register";
import { posRegisterData } from "@/features/pos/queries";

export default async function PosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; held?: string }>;
}) {
  const [data, query] = await Promise.all([posRegisterData(), searchParams]);
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Point of sale"
        title="Register"
        description="Fast checkout backed by the Sales, Inventory Ledger, and shared Payments engines."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/pos/sessions"
              className="rounded-xl border px-3 py-2 text-sm"
            >
              Sessions
            </Link>
            <Link
              href="/dashboard/pos/receipts"
              className="rounded-xl border px-3 py-2 text-sm"
            >
              Receipts
            </Link>
            <Link
              href="/dashboard/pos/reports"
              className="rounded-xl border px-3 py-2 text-sm"
            >
              Reports
            </Link>
          </div>
        }
      />
      <ActionFeedback
        error={query.error}
        success={query.held ? "Cart held safely." : undefined}
      />
      <PosRegister
        organizationId={data.organization.id}
        userId={data.user.id}
        terminals={data.terminals}
        sessions={data.sessions}
        customers={data.customers}
        methods={data.methods}
        accounts={data.accounts}
        held={data.held}
        credits={data.credits}
        currency={data.currency}
        checkoutKey={crypto.randomUUID()}
      />
    </div>
  );
}
