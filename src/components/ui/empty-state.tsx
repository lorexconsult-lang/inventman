import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed bg-surface p-8 text-center">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-muted text-subtle">
          {icon}
        </span>
        <h2 className="mt-4 font-semibold">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-subtle">
          {description}
        </p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}
