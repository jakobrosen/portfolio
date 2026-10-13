import useAppState from "../state/useAppState";
import {
  addDays,
  isSameDay,
  minutesIntoDay,
  occupancy,
  startOfDay,
} from "../lib/bookings";
import DatePicker from "./DatePicker";
import { PlusIcon } from "./icons";

type TopBarProps = {
  // The moment the floor plan and lists show.
  time: Date;
  // True while `time` follows the clock.
  live: boolean;
  now: Date;
  // A fixed moment to look at, or null to follow the clock again.
  onTimeChange: (time: Date | null) => void;
  // Whether the new booking panel is open, the button toggles it.
  creating: boolean;
  onNewBooking: () => void;
};

const stepClass =
  "grid size-8 place-items-center rounded-md text-lg text-muted hover:bg-surface hover:text-foreground";

// A number with a label under it, like "6/12" over "seated".
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-sm font-medium tabular-nums">{value}</span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}

function TopBar({
  time,
  live,
  now,
  onTimeChange,
  creating,
  onNewBooking,
}: TopBarProps) {
  const { state } = useAppState();
  const stats = occupancy(state.tables, state.bookings, time);

  // Other days are shown at the current time of day, and coming back to
  // today follows the clock again.
  function pickDay(day: Date) {
    if (isSameDay(day, now)) {
      onTimeChange(null);
      return;
    }
    const picked = startOfDay(day);
    picked.setMinutes(minutesIntoDay(time));
    onTimeChange(picked);
  }

  return (
    <header className="flex items-center gap-6 border-b border-border bg-panel px-6 py-3 on-accent">
      <h1 className="font-medium">Table Booking</h1>

      <div className="flex items-center gap-1" aria-label="Day">
        <button
          type="button"
          aria-label="Previous day"
          onClick={() => pickDay(addDays(time, -1))}
          className={stepClass}>
          ‹
        </button>
        <DatePicker value={time} today={now} onChange={pickDay} />
        <button
          type="button"
          aria-label="Next day"
          onClick={() => pickDay(addDays(time, 1))}
          className={stepClass}>
          ›
        </button>
      </div>

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
          Today
        </button>
      )}

      <div
        aria-label="Occupancy"
        className="ml-auto hidden items-center gap-5 border-l border-border pl-6 xl:flex">
        <Stat value={`${stats.seated}/${stats.tables}`} label="tables seated" />
        <Stat value={String(stats.expected)} label="expected" />
        <Stat value={String(stats.guests)} label="guests" />
        <div className="flex flex-col gap-1 leading-tight">
          <span className="text-sm font-medium tabular-nums">
            {stats.percent}% full
          </span>
          <span className="h-1.5 w-20 overflow-hidden rounded-full bg-surface">
            <span
              className="block h-full rounded-full bg-occupied"
              style={{ width: `${stats.percent}%` }}
            />
          </span>
        </div>
      </div>

      <button
        type="button"
        aria-expanded={creating}
        // The panel leaves clicks on its own button to the button itself.
        data-new-booking-trigger
        onClick={onNewBooking}
        className="ml-auto flex shrink-0 items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground xl:ml-0">
        <PlusIcon />
        New booking
      </button>
    </header>
  );
}

export default TopBar;
