import type { ReactNode } from "react";
import { requireOrganizationFeature } from "@/features/organizations/context";
export default async function ProcurementLayout({ children }: { children: ReactNode }) { await requireOrganizationFeature("procurement"); return children; }
