import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import useAppState from "../state/useAppState";
import { addDays, isSameDay } from "../lib/bookings";
import { addMonths, dayKey, monthGrid, weekday } from "../lib/calendar";
import { formatDate } from "../lib/format";
import { CalendarIcon } from "./icons";

type DatePickerProps = {
  // The day being shown.
  value: Date;
  today: Date;
  onChange: (day: Date) => void;
};

const monthFormat = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
});
const fullDateFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

// The date in the top bar, which opens a month calendar. Days with bookings
// get a dot, and the calendar works fully from the keyboard.
function DatePicker({ value, today, onChange }: DatePickerProps) {
  const { state } = useAppState();
  const [open, setOpen] = useState(false);
  // The day with keyboard focus, which also decides the month shown.
  const [focused, setFocused] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  // Set when focus should follow `focused`: on opening and on arrow keys,
  // but not when the month buttons are clicked.
  const moveFocus = useRef(false);

  const bookingCounts = new Map<string, number>();
  for (const booking of state.bookings) {
    const key = dayKey(new Date(booking.start));
    bookingCounts.set(key, (bookingCounts.get(key) ?? 0) + 1);
  }

  useEffect(() => {
    if (!open || !moveFocus.current) return;
    moveFocus.current = false;
    gridRef.current
      ?.querySelector<HTMLElement>(`[data-date="${dayKey(focused)}"]`)
      ?.focus();
  }, [open, focused]);

  // Clicking anywhere else closes the calendar.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function openCalendar() {
    setFocused(value);
    moveFocus.current = true;
    setOpen(true);
  }

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function pick(day: Date) {
    onChange(day);
    close();
  }

  function moveTo(day: Date) {
    moveFocus.current = true;
    setFocused(day);
  }

  function onGridKeyDown(event: KeyboardEvent) {
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      PageUp: () => addMonths(focused, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focused, event.shiftKey ? 12 : 1),
      Home: () => addDays(focused, -weekday(focused)),
      End: () => addDays(focused, 6 - weekday(focused)),
    };
    const move = moves[event.key];
    if (move) moveTo(move());
    else if (event.key === "Enter" || event.key === " ") pick(focused);
    else return;
    // Keeps the app's own shortcuts, like moving tables, out of it.
    event.preventDefault();
    event.stopPropagation();
  }

  const days = monthGrid(focused);
  const weeks = Array.from({ length: days.length / 7 }, (_, i) =>
    days.slice(i * 7, i * 7 + 7),
  );
  const tomorrow = addDays(today, 1);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Date, ${fullDateFormat.format(value)}. Choose another date`}
        onClick={() => (open ? close() : openCalendar())}
        className={`flex min-w-36 items-center justify-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium hover:bg-surface ${open ? "bg-surface" : ""}`}>
        <CalendarIcon />
        {formatDate(value)}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose a date"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              close();
            }
          }}
          className="absolute top-full left-1/2 z-50 mt-2 w-72 -translate-x-1/2 rounded-xl border border-border bg-panel p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setFocused(addMonths(focused, -1))}
              className="grid size-8 place-items-center rounded-md text-lg text-muted hover:bg-surface hover:text-foreground">
              ‹
            </button>
            <h2 aria-live="polite" className="text-sm font-medium">
              {monthFormat.format(focused)}
            </h2>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setFocused(addMonths(focused, 1))}
              className="grid size-8 place-items-center rounded-md text-lg text-muted hover:bg-surface hover:text-foreground">
              ›
            </button>
          </div>

          <div
            ref={gridRef}
            role="grid"
            aria-label={monthFormat.format(focused)}
            onKeyDown={onGridKeyDown}
            className="flex flex-col gap-0.5">
            <div role="row" className="grid grid-cols-7">
              {WEEKDAYS.map((name) => (
                <span
                  key={name}
                  role="columnheader"
                  className="py-1 text-center text-xs text-muted">
                  {name}
                </span>
              ))}
            </div>
            {weeks.map((week) => (
              <div
                key={dayKey(week[0])}
                role="row"
                className="grid grid-cols-7">
                {week.map((day) => {
                  const key = dayKey(day);
                  const selected = isSameDay(day, value);
                  const isToday = isSameDay(day, today);
                  const inMonth = day.getMonth() === focused.getMonth();
                  const count = bookingCounts.get(key) ?? 0;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="gridcell"
                      data-date={key}
                      tabIndex={isSameDay(day, focused) ? 0 : -1}
                      aria-selected={selected}
                      aria-current={isToday ? "date" : undefined}
                      aria-label={`${fullDateFormat.format(day)}${count ? `, ${count} ${count === 1 ? "booking" : "bookings"}` : ""}`}
                      onClick={() => pick(day)}
                      className={`relative mx-auto grid size-9 place-items-center rounded-full text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        selected
                          ? "bg-accent font-medium text-accent-foreground"
                          : `hover:bg-surface ${isToday ? "font-medium text-accent ring-1 ring-accent/50" : ""} ${inMonth ? "" : "text-muted/50"}`
                      }`}>
                      {day.getDate()}
                      {count > 0 && (
                        <span
                          aria-hidden
                          className={`absolute bottom-1 size-1 rounded-full ${selected ? "bg-accent-foreground" : "bg-accent"}`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-2 flex gap-2 border-t border-border pt-3">
            {[
              { label: "Today", day: today },
              { label: "Tomorrow", day: tomorrow },
            ].map(({ label, day }) => (
              <button
                key={label}
                type="button"
                onClick={() => pick(day)}
                className={`flex-1 rounded-md border py-1.5 text-sm ${
                  isSameDay(day, value)
                    ? "border-accent bg-accent-subtle text-accent"
                    : "border-border bg-background hover:border-accent/40"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DatePicker;
