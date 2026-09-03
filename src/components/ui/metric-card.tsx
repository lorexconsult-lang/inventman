import type { ReactNode } from "react";

export function MetricCard({ label, value, detail, icon }: { label: string; value: ReactNode; detail?: ReactNode; icon?: ReactNode }) {
  return <article className="app-surface min-w-0 p-5">
    <div className="flex items-start justify-between gap-4"><p className="text-sm font-medium text-subtle">{label}</p>{icon && <span className="text-subtle">{icon}</span>}</div>
    <p className="mt-6 font-mono text-3xl font-semibold tracking-tight text-ink">{value}</p>
    {detail && <div className="mt-2 text-xs text-subtle">{detail}</div>}
  </article>;
}
