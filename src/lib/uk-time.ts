/** Offset (minutes) of Europe/London from UTC at a given instant: 0 in GMT, 60 in BST. */
function londonOffset(at: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(at);
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"));
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** The instant a code expires: midnight UK time at the end of the chosen day (yyyy-mm-dd). */
export function ukMidnightAfter(day: string) {
  const [y = 0, m = 1, d = 1] = day.split("-").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d + 1));
  return new Date(guess.getTime() - londonOffset(guess) * 60000);
}

/** Inverse for editing: the UK calendar day whose midnight is this instant. */
export function ukDayBefore(iso: string) {
  const t = new Date(new Date(iso).getTime() - 60000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(t);
}
