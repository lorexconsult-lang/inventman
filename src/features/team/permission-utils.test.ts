import { describe, expect, it } from "vitest";
import {
  branchAccessSummary,
  groupPermissions,
  invitationState,
} from "./permission-utils";

describe("team access presentation", () => {
  it("groups capabilities by domain", () =>
    expect(
      Object.keys(
        groupPermissions([{ code: "sales.order_view" }, { code: "team.view" }]),
      ),
    ).toEqual(["sales", "team"]));
  it("maps stale pending invitations to expired", () =>
    expect(
      invitationState(
        "pending",
        "2020-01-01T00:00:00Z",
        Date.parse("2021-01-01"),
      ),
    ).toBe("EXPIRED"));
  it("summarizes unrestricted and selected branches", () => {
    expect(branchAccessSummary([], 3)).toBe("All branches");
    expect(branchAccessSummary(["North", "South", "West"], 4)).toBe(
      "North, South +1",
    );
  });
});
