import { ActionFeedback } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { cashEvent, closeSession } from "@/features/pos/actions";
import { requireOrganizationPermission } from "@/features/organizations/context";

export default async function PosSessions({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ client, organization }, query] = await Promise.all([
    requireOrganizationPermission("pos.session.close"),
    searchParams,
  ]);
  const { data } = await client
    .from("pos_session_summaries")
    .select("*")
    .eq("organization_id", organization.id)
    .order("opened_at", { ascending: false })
    .limit(100);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="POS"
        title="Till sessions"
        description="Opening float, operational cash movements, blind closing count, and variance review."
      />
      <ActionFeedback error={query.error} />
      <div className="space-y-4">
        {data?.map((session) => (
          <article
            key={session.id}
            className="rounded-2xl border bg-surface p-5"
          >
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <strong>
                  {session.session_number} · {session.terminal_name}
                </strong>
                <p className="text-sm text-subtle">
                  Opened{" "}
                  {session.opened_at
                    ? new Date(session.opened_at).toLocaleString()
                    : "—"}{" "}
                  · {session.transaction_count} sales
                </p>
              </div>
              <StatusBadge
                tone={
                  session.status === "OPEN"
                    ? "positive"
                    : session.status === "REVIEW_REQUIRED"
                      ? "warning"
                      : "neutral"
                }
              >
                {session.status}
              </StatusBadge>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-subtle">Opening float</dt>
                <dd>{session.opening_float}</dd>
              </div>
              <div>
                <dt className="text-subtle">Sales</dt>
                <dd>{session.sales_total}</dd>
              </div>
              <div>
                <dt className="text-subtle">Expected cash</dt>
                <dd>{session.live_expected_cash}</dd>
              </div>
              <div>
                <dt className="text-subtle">Variance</dt>
                <dd>{session.variance ?? "—"}</dd>
              </div>
            </dl>
            {session.status === "OPEN" && session.id && (
              <div className="mt-5 grid gap-4 border-t pt-5 lg:grid-cols-2">
                <form
                  action={cashEvent.bind(null, session.id, "CASH_IN")}
                  className="grid gap-2 rounded-xl bg-muted p-3"
                >
                  <strong className="text-sm">Cash movement</strong>
                  <input
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    className="min-h-10 rounded-lg border px-3"
                    placeholder="Amount"
                  />
                  <input
                    name="reason"
                    required
                    minLength={3}
                    className="min-h-10 rounded-lg border px-3"
                    placeholder="Reason"
                  />
                  <Button variant="secondary">Record cash in</Button>
                </form>
                <form
                  action={closeSession.bind(null, session.id)}
                  className="grid gap-2 rounded-xl bg-muted p-3"
                >
                  <strong className="text-sm">
                    Close session (blind count)
                  </strong>
                  <input
                    name="countedCash"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    className="min-h-10 rounded-lg border px-3"
                    placeholder="Counted cash"
                  />
                  <input
                    name="varianceReason"
                    className="min-h-10 rounded-lg border px-3"
                    placeholder="Variance reason when required"
                  />
                  <input
                    name="notes"
                    className="min-h-10 rounded-lg border px-3"
                    placeholder="Closing notes"
                  />
                  <Button>Close session</Button>
                </form>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
