const WEEKEND = new Set([0, 6]);

/**
 * DARF due date for a reference month (YYYY-MM): last business day of the following month.
 * Business day = Mon–Fri. Brazilian public holidays are out of scope for the MVP assumption.
 */
export function darfDueDate(month: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) {
    throw new Error("month must be YYYY-MM");
  }
  const year = Number.parseInt(match[1], 10);
  const monthIndex = Number.parseInt(match[2], 10) - 1;
  const following = new Date(Date.UTC(year, monthIndex + 2, 0));
  while (WEEKEND.has(following.getUTCDay())) {
    following.setUTCDate(following.getUTCDate() - 1);
  }
  const y = following.getUTCFullYear();
  const m = String(following.getUTCMonth() + 1).padStart(2, "0");
  const d = String(following.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
