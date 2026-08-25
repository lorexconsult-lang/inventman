import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "positive" | "warning" }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", tone === "neutral" && "bg-muted text-subtle", tone === "positive" && "bg-positive-soft text-positive", tone === "warning" && "bg-warning-soft text-warning")}>{children}</span>
  );
}
