import Link from "next/link";
import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { appConfig } from "@/config/app";
import { logout } from "@/features/auth/actions";
import { switchOrganization } from "@/features/organizations/actions";
import { WorkspaceNavigation } from "./workspace-navigation";

type Organization = { id: string; name: string; status: string };

export function AppShell({
  children,
  organization,
  organizations,
  permissions,
}: {
  children: ReactNode;
  organization: Organization;
  organizations: Organization[];
  permissions: string[];
}) {
  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-line bg-canvas/90 px-4 py-2 backdrop-blur md:px-6">
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-3 font-semibold tracking-tight"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-accent text-sm font-black text-white">
            I
          </span>
          <span className="hidden sm:inline">{appConfig.name}</span>
        </Link>
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <form action={switchOrganization}>
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
          <span
            className="hidden size-2 rounded-full bg-positive sm:inline"
            aria-label="Online"
          />
          <form action={logout}>
            <button
              aria-label="Sign out"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 hover:bg-muted hover:text-ink"
              type="submit"
            >
              <LogOut className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1600px] md:grid-cols-[240px_1fr]">
        <WorkspaceNavigation permissions={permissions} mode="desktop" />
        <main className="min-w-0 p-4 pb-24 sm:p-6 md:pb-6 lg:p-10">
          {children}
        </main>
      </div>
      <WorkspaceNavigation permissions={permissions} mode="mobile" />
    </div>
  );
}
