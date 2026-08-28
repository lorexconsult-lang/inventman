import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { requireOrganizationPermission } from "@/features/organizations/context";

export default async function SettingsPage() {
  const { organization } = await requireOrganizationPermission(
    "organizations.manage",
  );
  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Organization settings"
        description={`Administration for ${organization.name}.`}
      />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card
          href="/dashboard/settings/team"
          title="Team"
          text="Invite staff, manage status and control branch access."
        />
        <Card
          href="/dashboard/settings/roles"
          title="Roles & permissions"
          text="Create capability-based roles and inspect assignments."
        />
        <Card
          href="/dashboard/settings/payments"
          title="Payment accounts & methods"
          text="Configure operational settlement accounts and payment methods."
        />
        <Card
          href="/dashboard/settings/pos"
          title="Point of sale"
          text="Configure terminals, walk-in sales, receipts and till controls."
        />
        <Card
          href="/dashboard/settings/offline"
          title="Offline & Sync"
          text="Inspect device readiness, queued sales, conflicts, and synchronization policy."
        />
      </div>
    </>
  );
}
function Card({
  href,
  title,
  text,
}: {
  href: string;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border bg-surface p-5 hover:border-accent"
    >
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-subtle">{text}</p>
    </Link>
  );
}
