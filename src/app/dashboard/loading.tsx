import { InventmanLogo } from "@/components/brand/inventman-logo";

export default function DashboardLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading workspace"
      className="animate-pulse space-y-6"
    >
      <InventmanLogo
        variant="icon"
        decorative
        className="size-10"
        sizes="40px"
      />
      <div className="h-24 max-w-2xl rounded-xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div className="h-32 rounded-xl bg-muted" key={item} />
        ))}
      </div>
      <div className="h-80 rounded-xl bg-muted" />
    </div>
  );
}
