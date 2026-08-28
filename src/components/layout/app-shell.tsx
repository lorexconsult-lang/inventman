import Link from "next/link";
import type { ReactNode } from "react";
import { appConfig } from "@/config/app";
import { OfflineStatus } from "@/features/offline/components/offline-status";
import { PwaRegistration } from "@/features/offline/components/pwa-registration";
import { WorkspaceControls } from "./workspace-controls";
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
        <div className="flex min-w-0 items-center gap-1">
          <OfflineStatus
            organizationId={organization.id}
            canSync={permissions.includes("offline.sync")}
          />
          <WorkspaceControls
            organization={organization}
            organizations={organizations}
          />
        </div>
      </header>
      <div className="mx-auto grid max-w-[1600px] md:grid-cols-[240px_1fr]">
        <WorkspaceNavigation permissions={permissions} mode="desktop" />
        <main className="min-w-0 p-4 pb-24 sm:p-6 md:pb-6 lg:p-10">
          {children}
        </main>
      </div>
      <WorkspaceNavigation permissions={permissions} mode="mobile" />
      <PwaRegistration />
    </div>
  );
}
