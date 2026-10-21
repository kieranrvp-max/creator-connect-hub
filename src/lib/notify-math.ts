const round2 = (n: number) => Math.round(n * 100) / 100;

/** Referrer commission on one paid booking: total × referral rate, to the penny. */
export function referralEarning(total: number, referralRate: number) {
  return round2(Number(total) * Number(referralRate));
}

/** Rate as a display percentage, e.g. 0.025 → "2.5". */
export function ratePercent(rate: number) {
  return String(round2(Number(rate) * 100));
}

/** What the creator receives: total minus the platform commission. */
export function creatorShare(total: number, platformFee: number) {
  return round2(Number(total) - Number(platformFee));
}

/** Short excerpt for email previews. */
export function excerpt(s: string, max = 240) {
  const t = s.trim().replace(/\s+/g, " ");
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}
