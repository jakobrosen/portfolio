// Weeks start on Monday.
const DAYS_IN_GRID = 6 * 7;

// A stable key for a local calendar day, like "2026-10-13".
export function dayKey(date: Date) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

// The same day of the month `months` later, or the month's last day when it
// has fewer days (31 Jan + 1 month is 28 Feb).
export function addMonths(date: Date, months: number) {
  const moved = new Date(date);
  moved.setDate(1);
  moved.setMonth(moved.getMonth() + months);
  const lastDay = new Date(
    moved.getFullYear(),
    moved.getMonth() + 1,
    0,
  ).getDate();
  moved.setDate(Math.min(date.getDate(), lastDay));
  return moved;
}

// Days since the start of the week, Monday is 0.
export function weekday(date: Date) {
  return (date.getDay() + 6) % 7;
}

// Six full weeks covering the month of `date`, starting on a Monday. Always
// the same size, so the calendar doesn't change height between months.
export function monthGrid(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - weekday(first));
  return Array.from({ length: DAYS_IN_GRID }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return day;
  });
}
