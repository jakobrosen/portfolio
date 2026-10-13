import type { Booking, Table } from "../types";

// A booking counts as upcoming this long before it starts.
export const UPCOMING_WINDOW_MIN = 60;

export type TableStatus = "vacant" | "upcoming" | "reserved" | "occupied";

const MINUTE = 60_000;

const startOf = (booking: Booking) => new Date(booking.start).getTime();
const endOf = (booking: Booking) =>
  startOf(booking) + booking.durationMin * MINUTE;

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// The table's bookings on the given day, earliest first.
export function bookingsFor(bookings: Booking[], tableId: string, day: Date) {
  return bookings
    .filter(
      (booking) =>
        booking.tableId === tableId && isSameDay(new Date(booking.start), day),
    )
    .sort((a, b) => startOf(a) - startOf(b));
}

// What the table looks like at a given time, and the booking behind it.
// Seated guests count from when they arrived, even if they came early.
export function statusAt(
  tableId: string,
  bookings: Booking[],
  time: Date,
): { status: TableStatus; booking?: Booking } {
  const t = time.getTime();
  const own = bookings.filter((booking) => booking.tableId === tableId);

  const seated = own.find(
    (b) => b.seatedAt && new Date(b.seatedAt).getTime() <= t && t < endOf(b),
  );
  if (seated) return { status: "occupied", booking: seated };

  const active = own.find((b) => startOf(b) <= t && t < endOf(b));
  if (active) return { status: "reserved", booking: active };

  const upcoming = own
    .filter(
      (b) => t < startOf(b) && startOf(b) - t <= UPCOMING_WINDOW_MIN * MINUTE,
    )
    .sort((a, b) => startOf(a) - startOf(b))[0];
  if (upcoming) return { status: "upcoming", booking: upcoming };

  return { status: "vacant" };
}

export function overlapsInTime(a: Booking, b: Booking) {
  return startOf(a) < endOf(b) && startOf(b) < endOf(a);
}

// Other bookings on the same table whose times overlap this one.
export function conflicts(booking: Booking, bookings: Booking[]) {
  return bookings.filter(
    (other) =>
      other.id !== booking.id &&
      other.tableId === booking.tableId &&
      overlapsInTime(booking, other),
  );
}

// Free tables with enough chairs, the snuggest fit first so big tables stay
// available for big parties.
export function suggestTables(
  tables: Table[],
  bookings: Booking[],
  request: { partySize: number; start: string; durationMin: number },
) {
  return tables
    .filter((table) => table.seats >= request.partySize)
    .filter(
      (table) =>
        conflicts(
          { ...request, id: "", tableId: table.id, guestName: "" },
          bookings,
        ).length === 0,
    )
    .sort(
      (a, b) =>
        a.seats - b.seats ||
        a.label.localeCompare(b.label, undefined, { numeric: true }),
    );
}
