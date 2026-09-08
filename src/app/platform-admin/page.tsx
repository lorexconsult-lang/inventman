import {
  changeSubscription,
  setCommercialAccessMode,
  setTenantSuspension,
} from "@/features/subscriptions/actions";
import { platformMetrics } from "@/features/subscriptions/domain";
import { getPlatformOverview } from "@/features/subscriptions/queries";

export default async function PlatformOverview({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [data, query] = await Promise.all([
    getPlatformOverview(),
    searchParams,
  ]);
  const metrics = platformMetrics(
    data.subscriptions.map((subscription) => ({
      status: subscription.status,
      monthlyEquivalent:
        subscription.billing_interval === "ANNUAL"
          ? Number(subscription.price_snapshot) / 12
          : Number(subscription.price_snapshot),
    })),
  );
  const latestByOrg = new Map(
    data.subscriptions.map((subscription) => [
      subscription.organization_id,
      subscription,
    ]),
  );

  return (
    <>
      <Header
        title="Commercial control plane"
        text="Tenant commercial state, subscription health and guarded platform actions."
      />
      {query.error && (
        <p className="mt-5 rounded-xl bg-red-950 p-4 text-red-200">
          {query.error}
        </p>
      )}
      {query.accessModeChanged && (
        <p className="mt-5 rounded-xl bg-emerald-950 p-4 text-emerald-200">
          Commercial access mode updated and audited.
        </p>
      )}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Metric label="Application access" value={data.accessMode} />
        <Metric label="Organizations" value={data.organizations.length} />
        <Metric
          label="Active subscriptions"
          value={metrics.activeSubscriptions}
        />
        <Metric label="Trials" value={metrics.trials} />
        <Metric label="Past due" value={metrics.pastDue} />
        <Metric
          label="Deterministic MRR"
          value={`GBP ${metrics.mrr.toFixed(2)}`}
        />
      </section>

      <section className="mt-8 rounded-2xl border border-white/15 bg-white/5 p-5">
        <h2 className="font-semibold">Application access mode</h2>
        <p className="mt-1 text-sm text-slate-400">
          Open access grants active tenant members full plan entitlements while
          preserving authentication, RBAC, branch scope, RLS and platform
          suspension. Subscription mode restores the recorded commercial
          lifecycle and plan limits.
        </p>
        <form
          action={setCommercialAccessMode}
          className="mt-4 grid gap-3 md:grid-cols-[220px_minmax(0,1fr)_auto]"
        >
          <select
            name="mode"
            defaultValue={data.accessMode}
            className="rounded-lg border border-white/20 bg-[#101b2d] px-3 py-2"
          >
            <option value="OPEN_ACCESS">OPEN_ACCESS</option>
            <option value="SUBSCRIPTION">SUBSCRIPTION</option>
          </select>
          <input
            required
            minLength={3}
            name="reason"
            placeholder="Required audit reason"
            className="rounded-lg border border-white/20 bg-[#101b2d] px-3 py-2"
          />
          <button className="rounded-lg bg-sky-500 px-4 py-2 font-semibold text-slate-950">
            Update mode
          </button>
        </form>
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-white/15 bg-white/5">
        <div className="border-b border-white/15 p-5">
          <h2 className="font-semibold">Recent tenants</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="p-4">Organization</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Usage</th>
                <th className="min-w-80">Controlled action</th>
              </tr>
            </thead>
            <tbody>
              {data.organizations.slice(0, 20).map((organization) => {
                const subscription = latestByOrg.get(organization.id);
                return (
                  <tr
                    className="border-t border-white/10"
                    key={organization.id}
                  >
                    <td className="p-4">
                      <strong>{organization.name}</strong>
                      <p className="text-xs text-slate-400">
                        {organization.slug}
                      </p>
                    </td>
                    <td>{subscription?.saas_plans?.name ?? "—"}</td>
                    <td>
                      {organization.platform_suspended_at
                        ? "PLATFORM SUSPENDED"
                        : (subscription?.status ?? "NONE")}
                    </td>
                    <td>
                      {organization.branches?.[0]?.count ?? 0} branches ·{" "}
                      {organization.organization_members?.[0]?.count ?? 0} users
                    </td>
                    <td className="py-3 pr-4">
                      <form
                        action={setTenantSuspension}
                        className="flex gap-2"
                      >
                        <input
                          type="hidden"
                          name="organizationId"
                          value={organization.id}
                        />
                        <input
                          type="hidden"
                          name="suspended"
                          value={
                            organization.platform_suspended_at
                              ? "false"
                              : "true"
                          }
                        />
                        <input
                          required
                          name="reason"
                          placeholder="Required reason"
                          className="min-w-0 flex-1 rounded-lg border border-white/20 bg-[#101b2d] px-3 py-2"
                        />
                        <button className="rounded-lg border border-white/20 px-3 py-2">
                          {organization.platform_suspended_at
                            ? "Reactivate"
                            : "Suspend"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-white/15 bg-white/5 p-5">
        <h2 className="font-semibold">Manual subscription override</h2>
        <p className="mt-1 text-sm text-slate-400">
          Provider-backed activations should normally arrive through verified
          webhooks. Every manual override requires a reason and is audited.
        </p>
        <form
          action={changeSubscription}
          className="mt-4 grid gap-3 md:grid-cols-6"
        >
          <select
            required
            name="organizationId"
            className="rounded-lg border border-white/20 bg-[#101b2d] px-3 py-2"
          >
            {data.organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
          <select
            required
            name="planId"
            className="rounded-lg border border-white/20 bg-[#101b2d] px-3 py-2"
          >
            {data.plans
              .filter((plan) => plan.status !== "ARCHIVED")
              .map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
          </select>
          <select
            name="interval"
            className="rounded-lg border border-white/20 bg-[#101b2d] px-3 py-2"
          >
            <option>MONTHLY</option>
            <option>ANNUAL</option>
          </select>
          <select
            name="status"
            className="rounded-lg border border-white/20 bg-[#101b2d] px-3 py-2"
          >
            <option>ACTIVE</option>
            <option>TRIALING</option>
            <option>GRACE_PERIOD</option>
            <option>EXPIRED</option>
          </select>
          <input
            required
            name="reason"
            placeholder="Required reason"
            className="rounded-lg border border-white/20 bg-[#101b2d] px-3 py-2"
          />
          <button className="rounded-lg bg-sky-500 px-4 py-2 font-semibold text-slate-950">
            Apply override
          </button>
        </form>
      </section>
    </>
  );
}

function Header({ title, text }: { title: string; text: string }) {
  return (
    <header>
      <p className="text-sm font-semibold text-sky-300">Platform overview</p>
      <h2 className="mt-2 text-3xl font-semibold">{title}</h2>
      <p className="mt-3 text-slate-400">{text}</p>
    </header>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <article className="rounded-2xl border border-white/15 bg-white/5 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </article>
  );
}
