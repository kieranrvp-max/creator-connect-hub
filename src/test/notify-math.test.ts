import { describe, expect, it } from "vitest";
import { creatorShare, ratePercent, referralEarning } from "@/lib/notify-math";

describe("notification amounts", () => {
  it("referrer earns 2.5% of a £100 booking", () => {
    expect(referralEarning(100, 0.025)).toBe(2.5);
  });

  it("referral rate 0.025 is shown as 2.5%", () => {
    expect(ratePercent(0.025)).toBe("2.5");
  });

  it("creator share on £100 with 15% commission is £85", () => {
    expect(creatorShare(100, 15)).toBe(85);
  });
});
