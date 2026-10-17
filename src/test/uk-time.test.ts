import { describe, expect, it } from "vitest";
import { ukDayBefore, ukMidnightAfter } from "@/lib/uk-time";

describe("promo expiry at UK midnight", () => {
  it("summer (BST) day ends at 23:00 UTC", () => {
    expect(ukMidnightAfter("2026-07-10").toISOString()).toBe("2026-07-10T23:00:00.000Z");
  });
  it("winter (GMT) day ends at 00:00 UTC next day", () => {
    expect(ukMidnightAfter("2026-12-10").toISOString()).toBe("2026-12-11T00:00:00.000Z");
  });
  it("round-trips back to the chosen day", () => {
    expect(ukDayBefore(ukMidnightAfter("2026-10-24").toISOString())).toBe("2026-10-24");
  });
});
