export function groupPermissions<T extends { code: string }>(permissions: T[]) {
  return permissions.reduce<Record<string, T[]>>((groups, permission) => {
    const domain = permission.code.split(".")[0] ?? "other";
    return { ...groups, [domain]: [...(groups[domain] ?? []), permission] };
  }, {});
}

export function invitationState(
  status: string,
  expiresAt: string,
  now = Date.now(),
) {
  if (status === "pending" && new Date(expiresAt).getTime() <= now)
    return "EXPIRED";
  return status.toUpperCase();
}

export function branchAccessSummary(
  branchNames: string[],
  totalBranches: number,
) {
  if (!branchNames.length) return "All branches";
  if (branchNames.length === totalBranches) return "All branches";
  if (branchNames.length <= 2) return branchNames.join(", ");
  return `${branchNames.slice(0, 2).join(", ")} +${branchNames.length - 2}`;
}
