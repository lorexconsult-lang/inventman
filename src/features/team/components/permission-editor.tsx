import { groupPermissions } from "../permission-utils";

export function PermissionEditor({
  permissions,
  selected = [],
}: {
  permissions: Array<{ id: string; code: string; description: string }>;
  selected?: string[];
}) {
  const selectedSet = new Set(selected);
  return (
    <div className="space-y-4">
      {Object.entries(groupPermissions(permissions)).map(([domain, items]) => (
        <details key={domain} open className="rounded-xl border bg-surface p-4">
          <summary className="cursor-pointer font-semibold capitalize">
            {domain.replaceAll("_", " ")}{" "}
            <span className="text-sm font-normal text-subtle">
              ({items.length})
            </span>
          </summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {items.map((permission) => (
              <label
                key={permission.id}
                className="flex items-start gap-3 rounded-lg border p-3 text-sm"
              >
                <input
                  type="checkbox"
                  name="permissionId"
                  value={permission.id}
                  defaultChecked={selectedSet.has(permission.id)}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium">{permission.description}</span>
                  <span className="block text-xs text-subtle">
                    {permission.code}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
