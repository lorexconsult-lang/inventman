import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getAvailableOrganizations, getEffectivePermissions, getOrganizationContext } from "@/features/organizations/context";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const context = await getOrganizationContext();
  const [organizations, permissions] = await Promise.all([
    getAvailableOrganizations(),
    getEffectivePermissions(context.organization.id),
  ]);
  return <AppShell organization={context.organization} organizations={organizations} permissions={[...permissions]}>{children}</AppShell>;
}
