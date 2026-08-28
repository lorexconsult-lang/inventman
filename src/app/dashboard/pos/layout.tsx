import type { ReactNode } from "react";
import { requireOrganizationFeature } from "@/features/organizations/context";
export default async function PosLayout({ children }: { children: ReactNode }) { await requireOrganizationFeature("pos"); return children; }
