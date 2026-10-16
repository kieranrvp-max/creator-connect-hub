import { describe, expect, it } from "vitest";
import { bookingCharge } from "@/lib/checkout-charge";

describe("included sponsorship commission", () => {
  it("retains £15 from a £100 transaction using a Connect application fee", () => {
    expect(bookingCharge(100, 15, "acct_creator", "booking", "sponsor").application_fee_amount).toBe(1500);
  });
  it("routes the payment to the creator with an £85 share", () => {
    const charge = bookingCharge(100, 15, "acct_creator", "booking", "sponsor");
    expect(charge.transfer_data).toEqual({ destination: "acct_creator" });
    expect(10000 - Number(charge.application_fee_amount)).toBe(8500);
  });
  it("rejects a booking fee that is not 15%", () => {
    expect(() => bookingCharge(100, 10, "acct_creator", "booking", "sponsor")).toThrow("expected 15%");
  });
  it("rounds a 15% commission to the nearest penny", () => {
    expect(bookingCharge(19.99, 3, "acct_creator", "booking", "sponsor").application_fee_amount).toBe(300);
  });
  it("allows the EARLYBIRD 5% commission so the creator keeps £95 of £100", () => {
    const charge = bookingCharge(100, 5, "acct_creator", "booking", "sponsor");
    expect(charge.application_fee_amount).toBe(500);
    expect(10000 - charge.application_fee_amount).toBe(9500);
  });
});
