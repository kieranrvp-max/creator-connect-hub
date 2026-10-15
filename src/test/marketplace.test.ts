import { describe, expect, it } from "vitest";
import { calcFee, calcTotal } from "@/lib/marketplace";

describe("platform fee", () => {
  it("charges a 10% platform fee", () => {
    expect(calcFee(220)).toBe(22);
  });
  it("adds the fee on top of the slot price", () => {
    expect(calcTotal(160)).toBe(176);
  });
});
