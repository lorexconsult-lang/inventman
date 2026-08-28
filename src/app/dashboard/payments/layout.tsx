import type { ReactNode } from "react";
import { requireOrganizationFeature } from "@/features/organizations/context";
export default async function PaymentsLayout({ children }: { children: ReactNode }) { await requireOrganizationFeature("payments"); return children; }
