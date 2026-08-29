import Link from "next/link";
import type { ReactNode } from "react";
import { appConfig } from "@/config/app";
import { OfflineStatus } from "@/features/offline/components/offline-status";
import { PwaRegistration } from "@/features/offline/components/pwa-registration";
import { WorkspaceControls } from "./workspace-controls";
import { WorkspaceBreadcrumbs } from "./workspace-breadcrumbs";
import { WorkspaceNavigation } from "./workspace-navigation";

type Organization = { id: string; name: string; status: string };

export function AppShell({
  children,
  organization,
  organizations,
  permissions,
  features,
}: {
  children: ReactNode;
  organization: Organization;
  organizations: Organization[];
  permissions: string[];
  features: string[];
}) {
  return (
    <div className="app-workspace text-ink md:grid md:grid-cols-[256px_minmax(0,1fr)]">
      <aside className="app-sidebar sticky top-0 hidden h-dvh overflow-y-auto md:flex md:flex-col">
        <Link href="/dashboard" className="flex min-h-18 items-center gap-3 border-b border-white/10 px-5 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-lg bg-accent text-sm font-black text-white">I</span>
          <span>{appConfig.name}</span>
        </Link>
        <div className="border-b border-white/10 px-5 py-4">
          <p className="app-sidebar-muted text-[10px] font-bold uppercase tracking-[.14em]">Organization</p>
          <p className="mt-1 truncate text-sm font-semibold" title={organization.name}>{organization.name}</p>
        </div>
        <WorkspaceNavigation permissions={permissions} features={features} mode="desktop" />
      </aside>
      <div className="min-w-0">
        <header className="app-topbar fixed inset-x-0 top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-line bg-surface/95 px-16 py-2 backdrop-blur md:sticky md:px-6">
          <WorkspaceBreadcrumbs />
          <div className="flex min-w-0 shrink-0 items-center gap-1">
            <OfflineStatus organizationId={organization.id} canSync={permissions.includes("offline.sync")} />
            <WorkspaceControls organization={organization} organizations={organizations} />
          </div>
        </header>
        <main className="app-main min-w-0 p-4 pt-20 sm:p-6 sm:pt-20 md:p-8 lg:p-10">
          <div className="app-page">
          {children}
          </div>
        </main>
      </div>
      <WorkspaceNavigation permissions={permissions} features={features} mode="mobile" />
      <PwaRegistration />
    </div>
  );
}
