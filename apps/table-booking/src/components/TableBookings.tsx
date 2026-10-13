import { useState } from "react";
import useAppState from "../state/useAppState";
import { bookingEnd, bookingState, bookingsFor } from "../lib/bookings";
import { formatGuests, formatRange } from "../lib/format";
import type { Booking, Table } from "../types";
import BookingForm from "./BookingForm";
import IconButton from "./IconButton";
import { CheckIcon, DeleteIcon, PlusIcon } from "./icons";
import { bookingDots } from "./status";

type TableBookingsProps = {
  table: Table;
  time: Date;
};

// The timeline covers at least these hours, more if bookings reach outside.
const OPENS = 11;
const CLOSES = 23;

const HOUR = 3_600_000;

// The table's day at a glance: booked stretches and a line for now.
function DayTimeline({ bookings, time }: { bookings: Booking[]; time: Date }) {
  const day = new Date(time);
  day.setHours(0, 0, 0, 0);
  const hourOf = (date: Date) => (date.getTime() - day.getTime()) / HOUR;

  const first = Math.min(
    OPENS,
    ...bookings.map((b) => Math.floor(hourOf(new Date(b.start)))),
  );
  const last = Math.max(
    CLOSES,
    ...bookings.map((b) => Math.ceil(hourOf(bookingEnd(b)))),
  );
  const at = (hour: number) => `${((hour - first) / (last - first)) * 100}%`;
  const now = hourOf(time);

  return (
    <div className="flex flex-col gap-1" aria-hidden>
      <div className="relative h-2 overflow-hidden rounded-full bg-surface">
        {bookings.map((booking) => {
          const start = hourOf(new Date(booking.start));
          const state = bookingState(booking, time);
          return (
            <span
              key={booking.id}
              className={`absolute inset-y-0 ${state === "finished" ? "bg-chair" : state === "seated" ? "bg-occupied" : "bg-upcoming"}`}
              style={{
                left: at(start),
                width: at(first + booking.durationMin / 60),
              }}
            />
          );
        })}
        {now >= first && now <= last && (
          <span
            className="absolute inset-y-0 w-0.5 bg-foreground"
            style={{ left: at(now) }}
          />
        )}
      </div>
      <div className="flex justify-between text-[10px] text-muted tabular-nums">
        <span>{String(first).padStart(2, "0")}:00</span>
        <span>{String(last % 24).padStart(2, "0")}:00</span>
      </div>
    </div>
  );
}

// The table's bookings for the day, with a form to add or change them.
function TableBookings({ table, time }: TableBookingsProps) {
  const { state, dispatch } = useAppState();
  const [editing, setEditing] = useState<Booking | "new" | null>(null);
  // A booking whose delete button has been pressed once.
  const [confirmingId, setConfirmingId] = useState<string>();

  const bookings = bookingsFor(state.bookings, table.id, time);

  if (editing) {
    return (
      <BookingForm
        table={table}
        booking={editing === "new" ? undefined : editing}
        time={time}
        onDone={() => setEditing(null)}
      />
    );
  }

  function toggleSeated(booking: Booking) {
    dispatch({
      type: "updateBooking",
      id: booking.id,
      changes: {
        seatedAt: booking.seatedAt ? undefined : time.toISOString(),
      },
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <DayTimeline bookings={bookings} time={time} />

      {/* The menu's header already says when there are none. */}
      {bookings.length > 0 && (
        <ul className="-mx-1 flex flex-col">
          {bookings.map((booking) => {
            const bookingStatus = bookingState(booking, time);
            const dot = bookingDots[bookingStatus];
            const finished = bookingStatus === "finished";
            return (
              <li
                key={booking.id}
                className={`flex items-center gap-2 rounded-md px-1 py-1 hover:bg-surface ${finished ? "opacity-60" : ""}`}>
                <span
                  title={dot.label}
                  className={`size-2.5 shrink-0 rounded-full ${dot.dot}`}
                />
                <button
                  type="button"
                  onClick={() => setEditing(booking)}
                  className="min-w-0 flex-1 rounded text-left outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  <span className="block truncate text-sm font-medium">
                    {booking.guestName}
                  </span>
                  <span className="block text-xs text-muted">
                    {formatRange(booking.start, booking.durationMin)} ·{" "}
                    {formatGuests(booking.partySize)}
                  </span>
                </button>
                {!finished && (
                  <IconButton
                    label={booking.seatedAt ? "Arrived" : "Mark as arrived"}
                    pressed={Boolean(booking.seatedAt)}
                    onClick={() => toggleSeated(booking)}>
                    <CheckIcon />
                  </IconButton>
                )}
                {confirmingId === booking.id ? (
                  <button
                    type="button"
                    autoFocus
                    onBlur={() => setConfirmingId(undefined)}
                    onClick={() =>
                      dispatch({ type: "removeBooking", id: booking.id })
                    }
                    className="rounded-md bg-conflict px-2 py-1 text-xs font-medium text-white">
                    Delete?
                  </button>
                ) : (
                  <IconButton
                    label="Delete booking"
                    tone="danger"
                    onClick={() => setConfirmingId(booking.id)}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setEditing("new")}
        className="flex items-center justify-center gap-1.5 rounded-md bg-accent py-1.5 text-sm font-medium text-accent-foreground">
        <PlusIcon />
        New booking
      </button>
    </div>
  );
}

export default TableBookings;
