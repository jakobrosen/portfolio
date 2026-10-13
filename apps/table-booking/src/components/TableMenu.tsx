import { useEffect, useRef, useState } from "react";
import useAppState from "../state/useAppState";
import { bookingsFor } from "../lib/bookings";
import { CHAIR_EXTENT, clamp } from "../lib/geometry";
import type { Mode, Table } from "../types";
import IconButton from "./IconButton";
import { CloseIcon } from "./icons";
import TableBookings from "./TableBookings";
import TableSettings from "./TableSettings";

type TableMenuProps = {
  table: Table;
  time: Date;
  // Edit mode shows the table's settings, booking mode its bookings.
  mode: Mode;
  onSelect: (id: string | undefined) => void;
};

const MENU_WIDTH = 288;
// Gap between the menu and the table's chairs.
const GAP = 12;
// Closest the menu gets to the sides of the visible floor plan.
const EDGE = 8;
// How far in from the menu's corners the arrow has to stay.
const ARROW_INSET = 18;

// Above or below the table, and how far left and right the menu can go
// while staying in view, in floor plan units.
type Placement = {
  side: "above" | "below";
  minLeft: number;
  maxLeft: number;
};

// A menu above or below the selected table: its bookings in booking mode,
// its settings in edit mode.
function TableMenu({ table, time, mode, onSelect }: TableMenuProps) {
  const { state, dispatch } = useAppState();
  // The name before editing, put back if the field is left empty.
  const [savedLabel, setSavedLabel] = useState(table.label);
  const menuRef = useRef<HTMLDivElement>(null);
  // Null until the menu has been measured, it stays hidden until then.
  const [placement, setPlacement] = useState<Placement | null>(null);
  // For the resize observer, which outlives the render it was set up in.
  const tableRef = useRef(table);
  useEffect(() => {
    tableRef.current = table;
  });
  // Set when the menu grows from something done in it, like opening the
  // booking form, so it's scrolled into view once it's been placed.
  const grew = useRef(false);

  // Goes above the table when there's room for it in the visible part of
  // the floor plan, otherwise below. Checked again when the menu changes
  // size, such as when the booking form opens.
  useEffect(() => {
    const menu = menuRef.current;
    const floor = menu?.closest("main");
    const content = menu?.offsetParent;
    if (!menu || !floor || !(content instanceof HTMLElement)) return;

    let previousHeight = 0;
    const observer = new ResizeObserver(() => {
      const view = floor.getBoundingClientRect();
      const origin = content.getBoundingClientRect();
      const height = menu.offsetHeight;
      const tableTop = origin.top + tableRef.current.y - CHAIR_EXTENT;
      setPlacement({
        side: tableTop - GAP - height >= view.top ? "above" : "below",
        minLeft: view.left - origin.left + EDGE,
        maxLeft: view.right - origin.left - EDGE - MENU_WIDTH,
      });

      // Not when it first opens, as moving the floor plan right after a
      // click is jarring.
      if (previousHeight && height > previousHeight) grew.current = true;
      previousHeight = height;
    });
    observer.observe(menu);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!grew.current) return;
    grew.current = false;
    menuRef.current?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "smooth",
    });
  }, [placement]);

  const bookingCount = bookingsFor(state.bookings, table.id, time).length;
  const side = placement?.side ?? "above";
  const centerX = table.x + table.width / 2;
  const left = placement
    ? Math.max(
        placement.minLeft,
        Math.min(centerX - MENU_WIDTH / 2, placement.maxLeft),
      )
    : centerX - MENU_WIDTH / 2;
  // Where the arrow meets the edge, lined up with the table's centre.
  const arrowLeft =
    clamp(centerX - left, ARROW_INSET, MENU_WIDTH - ARROW_INSET) - 6;

  const close = () => onSelect(undefined);

  return (
    <div
      ref={menuRef}
      role="dialog"
      aria-label={`Table ${table.label}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
      }}
      // Menus above the table hang from their bottom edge, so they stay next
      // to the table while their height changes.
      className={`absolute z-30 flex flex-col gap-3 rounded-xl border border-border bg-panel p-3 shadow-lg ${side === "above" ? "-translate-y-full" : ""} ${placement ? "" : "invisible"}`}
      style={{
        left,
        top:
          side === "above"
            ? table.y - CHAIR_EXTENT - GAP
            : table.y + table.height + CHAIR_EXTENT + GAP,
        width: MENU_WIDTH,
      }}>
      {/* Arrow pointing at the table. */}
      <span
        aria-hidden
        className={`absolute size-3 rotate-45 border-border bg-panel ${side === "above" ? "-bottom-1.5 border-r border-b" : "-top-1.5 border-t border-l"}`}
        style={{ left: arrowLeft }}
      />

      <div className="flex items-center gap-1">
        {mode === "booking" ? (
          <h2 className="min-w-0 flex-1 truncate px-2 py-1">
            <span className="font-medium">{table.label}</span>
            <span className="ml-2 text-sm text-muted">
              {bookingCount
                ? `${bookingCount} ${bookingCount === 1 ? "booking" : "bookings"}`
                : "No bookings"}
            </span>
          </h2>
        ) : (
          <input
            aria-label="Table name"
            value={table.label}
            onFocus={() => setSavedLabel(table.label)}
            onChange={(event) =>
              dispatch({
                type: "updateTable",
                id: table.id,
                changes: { label: event.target.value },
              })
            }
            onBlur={() => {
              if (!table.label.trim()) {
                dispatch({
                  type: "updateTable",
                  id: table.id,
                  changes: { label: savedLabel },
                });
              }
            }}
            className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 font-medium outline-none hover:border-border focus:border-accent focus:bg-background"
          />
        )}
        <IconButton label="Close" onClick={close}>
          <CloseIcon />
        </IconButton>
      </div>

      {mode === "booking" ? (
        <TableBookings table={table} time={time} />
      ) : (
        <TableSettings table={table} onSelect={onSelect} />
      )}
    </div>
  );
}

export default TableMenu;
