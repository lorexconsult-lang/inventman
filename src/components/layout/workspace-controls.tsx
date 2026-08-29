"use client";

import { useRef } from "react";
import { Building2, LogOut } from "lucide-react";
import { logout } from "@/features/auth/actions";
import { switchOrganization } from "@/features/organizations/actions";
import { hasPendingOfflineWork } from "@/features/offline/components/offline-status";

type Organization = { id: string; name: string; status: string };

export function WorkspaceControls({
  organization,
  organizations,
}: {
  organization: Organization;
  organizations: Organization[];
}) {
  const approvedSubmission = useRef(false);
  const guard = (
    event: React.FormEvent<HTMLFormElement>,
    action: string,
  ) => {
    if (approvedSubmission.current) return;
    event.preventDefault();
    const form = event.currentTarget;
    void hasPendingOfflineWork(organization.id).then((pending) => {
      if (
        pending &&
        !window.confirm(
          `Unsynced transactions for ${organization.name} will remain isolated on this device. ${action} anyway?`,
        )
      )
        return;
      approvedSubmission.current = true;
      form.requestSubmit();
    });
  };
  return (
    <div className="flex min-w-0 items-center gap-1 text-sm">
      <form
        action={switchOrganization}
        className="hidden lg:block"
        onSubmit={(event) => guard(event, "Switch workspace")}
      >
        <label className="sr-only" htmlFor="workspace-switcher">
          Current organization
        </label>
        <select
          id="workspace-switcher"
          name="organizationId"
          defaultValue={organization.id}
          className="max-w-44 rounded-lg border bg-surface px-3 py-2 text-sm"
          title="Select organization"
        >
          {organizations.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <button className="ml-1 rounded-lg border px-3 py-2 text-xs font-semibold">
          Switch
        </button>
      </form>
      <details className="group relative lg:hidden">
        <summary aria-label="Switch organization" className="grid size-10 list-none place-items-center rounded-lg text-subtle hover:bg-muted hover:text-ink [&::-webkit-details-marker]:hidden">
          <Building2 aria-hidden="true" className="size-4" />
        </summary>
        <div className="absolute right-0 top-12 w-64 rounded-xl border border-line bg-surface p-3 shadow-xl">
          <p className="mb-2 truncate text-xs font-semibold text-subtle">{organization.name}</p>
          <form action={switchOrganization} onSubmit={(event) => guard(event, "Switch workspace")}>
            <label className="sr-only" htmlFor="mobile-workspace-switcher">Current organization</label>
            <select className="w-full rounded-lg border bg-surface px-3 py-2 text-sm" defaultValue={organization.id} id="mobile-workspace-switcher" name="organizationId">
              {organizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <button className="mt-2 min-h-10 w-full rounded-lg bg-accent px-3 text-sm font-semibold text-white" type="submit">Switch organization</button>
          </form>
        </div>
      </details>
      <form
        action={logout}
        onSubmit={(event) => guard(event, "Sign out")}
      >
        <button
          aria-label="Sign out"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-subtle hover:bg-muted hover:text-ink"
          type="submit"
        >
          <LogOut className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </form>
    </div>
  );
}
