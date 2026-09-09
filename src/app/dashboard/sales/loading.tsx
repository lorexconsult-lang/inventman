import { InventmanLogo } from "@/components/brand/inventman-logo";

export default function Loading() {
  return (
    <div className="space-y-5" aria-label="Loading Sales">
      <InventmanLogo
        variant="icon"
        decorative
        className="size-8"
        sizes="32px"
      />
      <div className="h-20 animate-pulse rounded-2xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
