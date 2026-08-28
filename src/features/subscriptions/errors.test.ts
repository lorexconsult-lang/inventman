import { expect, it } from "vitest";
import { subscriptionErrorMessage } from "./errors";
it("distinguishes plan access from tenant permissions", () => expect(subscriptionErrorMessage("FEATURE_NOT_INCLUDED")).toContain("plan"));
