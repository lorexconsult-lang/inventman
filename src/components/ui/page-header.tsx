import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div>
        <p className="text-sm font-semibold text-accent">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-subtle">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
}
