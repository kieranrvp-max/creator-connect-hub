import { describe, expect, it } from "vitest";
import { calcFee, creatorShare } from "@/lib/marketplace";

describe("platform fee", () => {
  it("takes a 15% platform fee", () => {
    expect(calcFee(200)).toBe(30);
  });
  it("creator receives 85% of the listed price", () => {
    expect(creatorShare(160)).toBe(136);
  });
});
