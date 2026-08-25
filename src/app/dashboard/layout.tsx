import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { requireAuthenticatedUser } from "@/features/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await requireAuthenticatedUser();
  return <AppShell>{children}</AppShell>;
}
