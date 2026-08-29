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
    <header className="flex flex-col justify-between gap-5 border-b border-line pb-6 lg:flex-row lg:items-end">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.12em] text-accent">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-[2.15rem]">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-subtle sm:text-base">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
