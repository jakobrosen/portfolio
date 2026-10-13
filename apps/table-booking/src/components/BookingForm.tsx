import { useId, useState } from "react";
import useAppState from "../state/useAppState";
import {
  atTime,
  conflicts,
  nextFreeStart,
  nextSlot,
  SLOT_MIN,
  suggestTables,
} from "../lib/bookings";
import { formatRange, formatTime } from "../lib/format";
import type { Booking, Table } from "../types";

type BookingFormProps = {
  // Left out to pick one of the free tables in the form.
  table?: Table;
  // Left out for a new booking.
  booking?: Booking;
  // The time being looked at, used to suggest a start for new bookings.
  time: Date;
  // Called with the saved booking, or nothing when cancelled.
  onDone: (saved?: Booking) => void;
  // A table to point out on the floor plan, like a suggestion being looked at.
  onHighlight?: (tableId: string | undefined) => void;
};

const DEFAULT_DURATION = 90;
const DURATIONS = [60, 90, 120, 180];
const MAX_PARTY = 20;

// Every quarter hour of the day, as "HH:MM".
const TIMES = Array.from({ length: (24 * 60) / SLOT_MIN }, (_, i) => {
  const minutes = i * SLOT_MIN;
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
});

const inputClass =
  "w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-accent";

function BookingForm({
  table,
  booking,
  time,
  onDone,
  onHighlight,
}: BookingFormProps) {
  const { state, dispatch } = useAppState();
  const labelId = useId();
  const [id] = useState(() => booking?.id ?? crypto.randomUUID());
  const [guestName, setGuestName] = useState(booking?.guestName ?? "");
  const [partySize, setPartySize] = useState(
    booking?.partySize ?? Math.min(2, table?.seats ?? 2),
  );
  const [durationMin, setDurationMin] = useState(
    booking?.durationMin ?? DEFAULT_DURATION,
  );
  // New bookings start at the table's next free quarter hour, or the next
  // quarter hour when the table is still to be picked.
  const [start, setStart] = useState(() => {
    if (booking) return new Date(booking.start);
    if (table) {
      return nextFreeStart(table.id, state.bookings, time, DEFAULT_DURATION);
    }
    return nextSlot(time);
  });
  const [pickedId, setPickedId] = useState<string>();
  const [phone, setPhone] = useState(booking?.phone ?? "");
  const [note, setNote] = useState(booking?.note ?? "");
  const [showDetails, setShowDetails] = useState(
    Boolean(booking?.phone || booking?.note),
  );

  // Free tables that fit the party, when the form picks the table.
  const suggestions = table
    ? []
    : suggestTables(state.tables, state.bookings, {
        partySize,
        start: start.toISOString(),
        durationMin,
      });
  // A picked table that no longer fits the time or party is dropped.
  const tableId =
    table?.id ??
    (suggestions.some((t) => t.id === pickedId) ? pickedId : undefined);

  const draft: Booking = {
    ...booking,
    id,
    tableId: tableId ?? "",
    guestName: guestName.trim(),
    partySize,
    start: start.toISOString(),
    durationMin,
    phone: phone.trim() || undefined,
    note: note.trim() || undefined,
  };
  const clashes = tableId ? conflicts(draft, state.bookings) : [];
  const durations = DURATIONS.includes(durationMin)
    ? DURATIONS
    : [...DURATIONS, durationMin].sort((a, b) => a - b);

  const canSave = Boolean(draft.guestName && tableId && !clashes.length);

  function save() {
    if (!canSave) return;
    dispatch(
      booking
        ? { type: "updateBooking", id: booking.id, changes: draft }
        : { type: "addBooking", booking: draft },
    );
    onDone(draft);
  }

  return (
    <form
      aria-label={booking ? "Edit booking" : "New booking"}
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
      className="flex flex-col gap-3 text-sm">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">Guest name</span>
        <input
          autoFocus
          required
          value={guestName}
          onChange={(event) => setGuestName(event.target.value)}
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <span id={`${labelId}-party`} className="text-xs text-muted">
            Guests
          </span>
          <div
            role="group"
            aria-labelledby={`${labelId}-party`}
            className="flex items-center justify-between rounded-md border border-border bg-background">
            <button
              type="button"
              aria-label="Fewer guests"
              disabled={partySize <= 1}
              onClick={() => setPartySize(partySize - 1)}
              className="px-2.5 py-1.5 text-muted hover:text-foreground disabled:opacity-40">
              −
            </button>
            <span className="tabular-nums">{partySize}</span>
            <button
              type="button"
              aria-label="More guests"
              disabled={partySize >= MAX_PARTY}
              onClick={() => setPartySize(partySize + 1)}
              className="px-2.5 py-1.5 text-muted hover:text-foreground disabled:opacity-40">
              +
            </button>
          </div>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Time</span>
          <select
            value={formatTime(start)}
            onChange={(event) => setStart(atTime(start, event.target.value))}
            className={inputClass}>
            {TIMES.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-1">
        <span id={`${labelId}-length`} className="text-xs text-muted">
          Length
        </span>
        <div
          role="group"
          aria-labelledby={`${labelId}-length`}
          className="flex rounded-lg border border-border bg-background p-0.5">
          {durations.map((minutes) => (
            <button
              key={minutes}
              type="button"
              aria-pressed={durationMin === minutes}
              onClick={() => setDurationMin(minutes)}
              className={`flex-1 rounded-md py-1 text-xs ${
                durationMin === minutes
                  ? "bg-accent-subtle text-accent"
                  : "text-muted hover:text-foreground"
              }`}>
              {minutes / 60}h
            </button>
          ))}
        </div>
        <span className="text-xs text-muted">
          {formatRange(start, durationMin)}
        </span>
      </div>

      {showDetails ? (
        <>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Phone</span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Note</span>
            <textarea
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className={`${inputClass} resize-none`}
            />
          </label>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setShowDetails(true)}
          className="self-start text-xs text-accent hover:underline">
          + Add phone or note
        </button>
      )}

      {!table && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted">Free tables</span>
          {suggestions.length ? (
            <div
              role="radiogroup"
              aria-label="Table"
              onMouseLeave={() => onHighlight?.(tableId)}
              className="flex flex-wrap gap-1.5">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  role="radio"
                  aria-checked={suggestion.id === tableId}
                  onClick={() => {
                    setPickedId(suggestion.id);
                    onHighlight?.(suggestion.id);
                  }}
                  onMouseEnter={() => onHighlight?.(suggestion.id)}
                  className={`rounded-md border px-2 py-1 text-xs ${
                    suggestion.id === tableId
                      ? "border-accent bg-accent-subtle text-accent"
                      : "border-border bg-background hover:border-accent/40"
                  }`}>
                  <span className="font-medium">{suggestion.label}</span>
                  <span className="text-muted"> · {suggestion.seats}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-upcoming">
              No free table for {partySize} at {formatTime(start)}. Try another
              time or a shorter stay.
            </p>
          )}
        </div>
      )}

      {table && partySize > table.seats && (
        <p className="text-xs text-upcoming">
          {table.label} only has {table.seats}{" "}
          {table.seats === 1 ? "chair" : "chairs"}.
        </p>
      )}
      {clashes.length > 0 && (
        <p role="alert" className="text-xs text-conflict">
          Overlaps with{" "}
          {clashes
            .map(
              (other) =>
                `${other.guestName} (${formatRange(other.start, other.durationMin)})`,
            )
            .join(", ")}
          .
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onDone()}
          className="rounded-md border border-border bg-background py-1.5">
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSave}
          className="rounded-md bg-accent py-1.5 font-medium text-accent-foreground disabled:opacity-40">
          {booking ? "Save" : "Add booking"}
        </button>
      </div>
    </form>
  );
}

export default BookingForm;
