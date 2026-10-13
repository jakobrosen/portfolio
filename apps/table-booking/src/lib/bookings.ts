import type { Booking, Table } from "../types";

// A booking counts as upcoming this long before it starts.
export const UPCOMING_WINDOW_MIN = 60;

export type TableStatus = "vacant" | "upcoming" | "reserved" | "occupied";

// Bookings start on quarter hours.
export const SLOT_MIN = 15;

const MINUTE = 60_000;

const startOf = (booking: Booking) => new Date(booking.start).getTime();
const endOf = (booking: Booking) =>
  startOf(booking) + booking.durationMin * MINUTE;

export const bookingEnd = (booking: Booking) => new Date(endOf(booking));

// Midnight at the start of the given day, local time.
export function startOfDay(date: Date) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

// The same time of day, `days` days later (or earlier).
export function addDays(date: Date, days: number) {
  const moved = new Date(date);
  moved.setDate(moved.getDate() + days);
  return moved;
}

// Minutes since midnight.
export function minutesIntoDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

// The given day at "HH:MM", local time.
export function atTime(day: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(day);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

// The first quarter hour at or after the given time.
export function nextSlot(time: Date) {
  const slot = new Date(time);
  slot.setSeconds(0, 0);
  const minutes = slot.getMinutes();
  slot.setMinutes(Math.ceil(minutes / SLOT_MIN) * SLOT_MIN);
  if (slot.getTime() < time.getTime()) {
    slot.setMinutes(slot.getMinutes() + SLOT_MIN);
  }
  return slot;
}

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

// The earliest start from `from` onwards where a booking of the given length
// fits on the table, looking a day ahead. Falls back to `from` rounded up.
export function nextFreeStart(
  tableId: string,
  bookings: Booking[],
  from: Date,
  durationMin: number,
) {
  const first = nextSlot(from);
  for (let i = 0; i < (24 * 60) / SLOT_MIN; i++) {
    const start = new Date(first.getTime() + i * SLOT_MIN * MINUTE);
    const candidate: Booking = {
      id: "",
      tableId,
      guestName: "",
      partySize: 1,
      start: start.toISOString(),
      durationMin,
    };
    if (conflicts(candidate, bookings).length === 0) return start;
  }
  return first;
}

// Where a single booking stands at a given time.
export type BookingState = "upcoming" | "due" | "seated" | "finished";

export function bookingState(booking: Booking, time: Date): BookingState {
  const t = time.getTime();
  if (endOf(booking) <= t) return "finished";
  if (booking.seatedAt && new Date(booking.seatedAt).getTime() <= t) {
    return "seated";
  }
  return startOf(booking) <= t ? "due" : "upcoming";
}

// Bookings grouped by the hour they start in, earliest first and each group
// in start order. 18:00 holds everything starting from 18:00 to 18:59.
export function groupByHour(bookings: Booking[]) {
  const groups = new Map<number, Booking[]>();
  const sorted = [...bookings].sort((a, b) => startOf(a) - startOf(b));
  for (const booking of sorted) {
    const hour = new Date(booking.start).getHours();
    groups.set(hour, [...(groups.get(hour) ?? []), booking]);
  }
  return [...groups].map(([hour, inHour]) => ({ hour, bookings: inHour }));
}

export type Occupancy = {
  tables: number;
  // Tables with guests seated.
  seated: number;
  // Tables booked within the upcoming window, or waiting for late guests.
  expected: number;
  guests: number;
  seats: number;
  // Seated guests as a share of all chairs, 0–100.
  percent: number;
};

// How full the restaurant is at a given time.
export function occupancy(
  tables: Table[],
  bookings: Booking[],
  time: Date,
): Occupancy {
  let seated = 0;
  let expected = 0;
  let guests = 0;
  for (const table of tables) {
    const { status, booking } = statusAt(table.id, bookings, time);
    if (status === "occupied") {
      seated++;
      guests += booking?.partySize ?? 0;
    } else if (status !== "vacant") {
      expected++;
    }
  }
  const seats = tables.reduce((sum, table) => sum + table.seats, 0);
  return {
    tables: tables.length,
    seated,
    expected,
    guests,
    seats,
    percent: seats ? Math.round((guests / seats) * 100) : 0,
  };
}
