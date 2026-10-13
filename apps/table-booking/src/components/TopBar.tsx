import {
  addDays,
  isSameDay,
  minutesIntoDay,
  SLOT_MIN,
  startOfDay,
} from "../lib/bookings";
import { formatDate, formatTime } from "../lib/format";
import { PlusIcon } from "./icons";

type TopBarProps = {
  // The moment the floor plan and lists show.
  time: Date;
  // True while `time` follows the clock.
  live: boolean;
  now: Date;
  // A fixed moment to look at, or null to follow the clock again.
  onTimeChange: (time: Date | null) => void;
  onNewBooking: () => void;
};

const LAST_SLOT = 24 * 60 - SLOT_MIN;

const stepClass =
  "grid size-8 place-items-center rounded-md text-lg text-muted hover:bg-surface hover:text-foreground";

function TopBar({ time, live, now, onTimeChange, onNewBooking }: TopBarProps) {
  const today = isSameDay(time, now);
  const minutes = minutesIntoDay(time);

  return (
    <header className="flex items-center gap-6 border-b border-border bg-panel px-6 py-3">
      <h1 className="font-medium">Table Booking</h1>

      <div className="flex items-center gap-1" aria-label="Day">
        <button
          type="button"
          aria-label="Previous day"
          onClick={() => onTimeChange(addDays(time, -1))}
          className={stepClass}>
          ‹
        </button>
        <span className="min-w-24 text-center text-sm font-medium">
          {formatDate(time)}
        </span>
        <button
          type="button"
          aria-label="Next day"
          onClick={() => onTimeChange(addDays(time, 1))}
          className={stepClass}>
          ›
        </button>
      </div>

      <label className="flex min-w-0 flex-1 items-center gap-3 text-sm">
        <span className="sr-only">Time</span>
        <input
          type="range"
          min={0}
          max={LAST_SLOT}
          step={SLOT_MIN}
          value={Math.min(minutes - (minutes % SLOT_MIN), LAST_SLOT)}
          onChange={(event) => {
            const day = startOfDay(time);
            day.setMinutes(Number(event.target.value));
            onTimeChange(day);
          }}
          className="max-w-md min-w-0 flex-1 accent-accent"
        />
        <span className="w-11 font-medium tabular-nums">
          {formatTime(time)}
        </span>
      </label>

      {live ? (
        <span className="flex items-center gap-1.5 text-sm text-muted">
          <span className="size-2 animate-pulse rounded-full bg-vacant" />
          Live
        </span>
      ) : (
        <button
          type="button"
          onClick={() => onTimeChange(null)}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:border-accent/40">
          {today ? "Back to now" : "Today"}
        </button>
      )}

      <button
        type="button"
        onClick={onNewBooking}
        className="ml-auto flex shrink-0 items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
        <PlusIcon />
        New booking
      </button>
    </header>
  );
}

export default TopBar;
