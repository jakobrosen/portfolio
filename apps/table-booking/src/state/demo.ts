import type { AppState, Booking, Table, TableShape } from "../types";

function table(
  n: number,
  shape: TableShape,
  [x, y]: [number, number],
  [width, height]: [number, number],
  seats: number,
): Table {
  return { id: `t${n}`, label: `T${n}`, shape, x, y, width, height, seats };
}

const tables: Table[] = [
  table(1, "rect", [60, 60], [120, 80], 4),
  table(2, "rect", [60, 220], [120, 80], 4),
  table(3, "rect", [60, 380], [120, 80], 4),
  table(4, "rect", [260, 60], [80, 180], 6),
  table(5, "rect", [260, 300], [80, 180], 6),
  table(6, "round", [440, 60], [100, 100], 4),
  table(7, "round", [440, 240], [100, 100], 4),
  table(8, "round", [460, 420], [80, 80], 2),
  table(9, "rect", [640, 60], [240, 80], 8),
  table(10, "rect", [640, 220], [180, 80], 6),
  table(11, "rect", [640, 380], [80, 80], 2),
  table(12, "round", [780, 360], [140, 140], 6),
];

// Each row: table, guest, party size, start and duration in minutes, and
// whether the guests have arrived. Starts are relative to now, so the demo
// always has seated, upcoming and later bookings no matter when it's opened.
const bookingRows: [number, string, number, number, number, boolean][] = [
  [1, "John Doe", 3, -45, 90, true],
  [2, "Emma Clark", 4, -30, 120, true],
  [3, "Maria Svensson", 2, -15, 90, true],
  [5, "Cathy Clark", 6, 30, 120, false],
  [6, "David Johnson", 4, -60, 120, true],
  [9, "Sarah King", 7, 45, 150, false],
  [10, "Emma Watson", 5, -30, 90, true],
  [12, "John Davis", 6, -15, 120, true],
  [1, "Lisa Berg", 2, 120, 90, false],
  [7, "Omar Haddad", 3, 150, 90, false],
  [4, "Anna Lind", 5, 180, 120, false],
];

function demoBookings(now: Date): Booking[] {
  const base = new Date(now);
  base.setMinutes(Math.floor(base.getMinutes() / 15) * 15, 0, 0);
  const at = (offsetMin: number) =>
    new Date(base.getTime() + offsetMin * 60_000).toISOString();

  return bookingRows.map(
    ([n, guestName, partySize, offsetMin, durationMin, seated], i) => ({
      id: `b${i + 1}`,
      tableId: `t${n}`,
      guestName,
      partySize,
      start: at(offsetMin),
      durationMin,
      seatedAt: seated ? at(offsetMin) : undefined,
    }),
  );
}

export function createDemoState(now = new Date()): AppState {
  return { version: 1, tables, bookings: demoBookings(now) };
}
