import { useState } from "react";
import useAppState from "../state/useAppState";
import { bookingState, groupByHour, isSameDay } from "../lib/bookings";
import {
  formatDate,
  formatDuration,
  formatGuests,
  formatTime,
} from "../lib/format";
import type { Booking } from "../types";
import { bookingDots } from "./status";

type BookingListProps = {
  time: Date;
  onSelectTable: (id: string) => void;
  // The table under the pointer in the list, highlighted on the floor plan.
  onHoverTable: (id: string | undefined) => void;
};

// The day's bookings in the sidebar, under a heading for each hour.
function BookingList({ time, onSelectTable, onHoverTable }: BookingListProps) {
  const { state } = useAppState();
  const [query, setQuery] = useState("");

  const labels = new Map(state.tables.map((table) => [table.id, table.label]));
  const search = query.trim().toLowerCase();
  const matches = (booking: Booking) =>
    !search ||
    booking.guestName.toLowerCase().includes(search) ||
    labels.get(booking.tableId)?.toLowerCase().includes(search);

  const onDay = state.bookings.filter(
    (booking) => isSameDay(new Date(booking.start), time) && matches(booking),
  );
  const hours = groupByHour(onDay);

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        aria-label="Search bookings"
        placeholder="Search guest or table"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
      />

      {onDay.length === 0 && (
        <p className="text-sm text-muted">
          {search
            ? "No bookings match."
            : `No bookings on ${formatDate(time)}.`}
        </p>
      )}

      {hours.map(({ hour, bookings }) => {
        const guests = bookings.reduce((sum, b) => sum + b.partySize, 0);
        const current = hour === time.getHours();
        return (
          <section key={hour} className="flex flex-col gap-1">
            <h3
              className={`flex items-center justify-between px-1 text-xs font-medium ${current ? "text-foreground" : "text-muted"}`}>
              <span className="flex items-center gap-2">
                <span className="tabular-nums">
                  {String(hour).padStart(2, "0")}:00
                </span>
                {current && (
                  <span className="rounded-full bg-accent-subtle px-1.5 py-px text-[10px] tracking-wide uppercase">
                    Now
                  </span>
                )}
              </span>
              <span>
                {bookings.length}{" "}
                {bookings.length === 1 ? "booking" : "bookings"} ·{" "}
                {formatGuests(guests)}
              </span>
            </h3>
            <ul className="flex flex-col">
              {bookings.map((booking) => {
                const standing = bookingState(booking, time);
                const dot = bookingDots[standing];
                return (
                  <li key={booking.id}>
                    <button
                      type="button"
                      onClick={() => onSelectTable(booking.tableId)}
                      onMouseEnter={() => onHoverTable(booking.tableId)}
                      onMouseLeave={() => onHoverTable(undefined)}
                      onFocus={() => onHoverTable(booking.tableId)}
                      onBlur={() => onHoverTable(undefined)}
                      className={`group flex w-full items-center gap-3 rounded-md px-1 py-2 text-left outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-accent ${standing === "finished" ? "opacity-60" : ""}`}>
                      <span className="w-11 shrink-0 rounded-md bg-background py-1 text-center text-sm font-medium tabular-nums">
                        {formatTime(booking.start)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {booking.guestName}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {formatGuests(booking.partySize)}
                          {/* The length is detail, shown on hover or focus. */}
                          <span className="hidden group-hover:inline group-focus-visible:inline">
                            {" "}
                            · {formatDuration(booking.durationMin)}
                          </span>
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
                        <span
                          title={dot.label}
                          className={`size-2 rounded-full ${dot.dot}`}
                        />
                        {labels.get(booking.tableId)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export default BookingList;
