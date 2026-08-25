import { Boxes } from "lucide-react";
import { setStorageLocationStatus } from "../actions";

type Location = {
  id: string;
  parent_location_id: string | null;
  name: string;
  code: string;
  location_type: string;
  is_active: boolean;
};
export function LocationTree({ locations }: { locations: Location[] }) {
  const byParent = new Map<string | null, Location[]>();
  for (const location of locations)
    byParent.set(location.parent_location_id, [
      ...(byParent.get(location.parent_location_id) ?? []),
      location,
    ]);
  function render(parentId: string | null, depth = 0): React.ReactNode {
    return (byParent.get(parentId) ?? []).map((location) => (
      <li key={location.id} className="relative">
        <div
          className="flex min-h-11 items-center gap-3 rounded-xl border bg-surface px-3"
          style={{ marginLeft: `${Math.min(depth, 5) * 20}px` }}
        >
          <Boxes className="size-4 text-subtle" aria-hidden="true" />
          <span className="font-medium">{location.name}</span>
          <span className="rounded-md bg-muted px-2 py-1 text-xs text-subtle">
            {location.location_type}
          </span>
          <span className="ml-auto font-mono text-xs text-subtle">
            {location.code}
          </span>
          {location.parent_location_id && (
            <form
              action={setStorageLocationStatus.bind(
                null,
                location.id,
                !location.is_active,
              )}
            >
              <button className="text-xs font-semibold text-accent">
                {location.is_active ? "Deactivate" : "Restore"}
              </button>
            </form>
          )}
        </div>
        {(byParent.get(location.id)?.length ?? 0) > 0 && (
          <ul className="mt-2 space-y-2">{render(location.id, depth + 1)}</ul>
        )}
      </li>
    ));
  }
  return <ul className="space-y-2">{render(null)}</ul>;
}
