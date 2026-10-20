import { describe, expect, it } from "vitest";
import { discountFromFeeRate, feeRateFromDiscount, promoSplit } from "@/lib/promo-math";

describe("promo code discount math", () => {
  it("a 5% discount charges a 10% platform fee", () => {
    expect(feeRateFromDiscount(5)).toBe(0.1);
  });
  it("a 5% discount with a 2.5% referrer leaves the platform 7.5%", () => {
    expect(promoSplit(5, 2.5)).toEqual({ charged: 10, referrer: 2.5, platform: 7.5, creator: 90 });
  });
  it("rejects a discount above the standard 15%", () => {
    expect(() => feeRateFromDiscount(16)).toThrow();
  });
  it("rejects a referrer share larger than the fee charged", () => {
    expect(() => promoSplit(14, 2.5)).toThrow();
  });
  it("shows an existing 5% fee code (EARLYBIRD) as a 10% discount when editing", () => {
    expect(discountFromFeeRate(0.05)).toBe(10);
  });
});
