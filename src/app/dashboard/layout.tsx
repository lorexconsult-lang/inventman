import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getAvailableOrganizations, getEffectivePermissions, getEntitledFeatures, getOrganizationContext } from "@/features/organizations/context";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const context = await getOrganizationContext();
  const [organizations, permissions, features] = await Promise.all([
    getAvailableOrganizations(),
    getEffectivePermissions(context.organization.id),
    getEntitledFeatures(context.organization.id),
  ]);
  return <AppShell organization={context.organization} organizations={organizations} permissions={[...permissions]} features={[...features]}>{children}</AppShell>;
}
