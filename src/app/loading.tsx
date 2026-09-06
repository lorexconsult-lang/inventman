import { InventmanLogo } from "@/components/brand/inventman-logo";

export default function Loading() {
  return <div className="animate-pulse space-y-6" aria-label="Loading"><InventmanLogo variant="icon" decorative className="size-12" sizes="48px" /><div className="h-10 w-72 rounded-lg bg-muted" /><div className="grid gap-4 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-40 rounded-2xl bg-muted" />)}</div><div className="h-72 rounded-2xl bg-muted" /></div>;
}
