import { useState, type ReactNode } from "react";
import useAppState from "../state/useAppState";
import {
  clamp,
  collides,
  findFreeSpot,
  maxSeats,
  MAX_TABLE_SIZE,
  MENU_ARROW_INSET,
  MIN_TABLE_SIZE,
  placeMenu,
  snap,
  type MenuSide,
} from "../lib/geometry";
import { nextLabel } from "../lib/presets";
import type { Table, TableShape } from "../types";
import IconButton from "./IconButton";
import {
  CloseIcon,
  DeleteIcon,
  DuplicateIcon,
  RectIcon,
  RoundIcon,
} from "./icons";

type TableMenuProps = {
  table: Table;
  onSelect: (id: string | undefined) => void;
};

const MENU_WIDTH = 288;
// Height of the menu with its controls, used to pick a side with room.
const MENU_HEIGHT = 136;

// The arrow sits on the edge facing the table.
const arrowStyles: Record<MenuSide, string> = {
  right: "-left-1.5 border-b border-l",
  left: "-right-1.5 border-t border-r",
  below: "-top-1.5 border-t border-l",
  above: "-bottom-1.5 border-r border-b",
};

const shapes = [
  { shape: "rect", label: "Rectangle", icon: <RectIcon /> },
  { shape: "round", label: "Round", icon: <RoundIcon /> },
] satisfies { shape: TableShape; label: string; icon: ReactNode }[];

// Round tables need equal sides, so a rectangle becomes a circle of about
// the same size. A circle becomes a square.
function withShape(table: Table, shape: TableShape): Table {
  const size =
    shape === "round"
      ? clamp(
          snap((table.width + table.height) / 2),
          MIN_TABLE_SIZE,
          MAX_TABLE_SIZE,
        )
      : table.width;
  return { ...table, shape, width: size, height: size };
}

// A small menu next to the selected table, for its name, shape and chairs.
function TableMenu({ table, onSelect }: TableMenuProps) {
  const { state, dispatch } = useAppState();
  const [shapeError, setShapeError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // The name before editing, put back if the field is left empty.
  const [savedLabel, setSavedLabel] = useState(table.label);

  const max = maxSeats(table);
  const bookingCount = state.bookings.filter(
    (booking) => booking.tableId === table.id,
  ).length;

  const { side, x, y } = placeMenu(table, state.tables, {
    width: MENU_WIDTH,
    height: MENU_HEIGHT,
  });
  const sideways = side === "left" || side === "right";
  // Where the arrow meets the edge, lined up with the table's centre.
  const arrowOffset = sideways
    ? clamp(
        table.y + table.height / 2 - y,
        MENU_ARROW_INSET,
        MENU_HEIGHT - MENU_ARROW_INSET,
      ) - 6
    : clamp(
        table.x + table.width / 2 - x,
        MENU_ARROW_INSET,
        MENU_WIDTH - MENU_ARROW_INSET,
      ) - 6;

  const update = (changes: Partial<Omit<Table, "id">>) =>
    dispatch({ type: "updateTable", id: table.id, changes });
  const close = () => onSelect(undefined);

  function changeShape(shape: TableShape) {
    if (shape === table.shape) return;
    const changed = withShape(table, shape);
    if (collides(changed, state.tables)) {
      setShapeError("Not enough room here. Move the table and try again.");
      return;
    }
    setShapeError("");
    update(changed);
  }

  function duplicate() {
    const spot = findFreeSpot(table, state.tables);
    if (!spot) return;
    const copy = {
      ...spot,
      id: crypto.randomUUID(),
      label: nextLabel(state.tables),
    };
    dispatch({ type: "addTable", table: copy });
    onSelect(copy.id);
  }

  function remove() {
    dispatch({ type: "removeTable", id: table.id });
    close();
  }

  return (
    <div
      role="dialog"
      aria-label={`Table ${table.label}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
      }}
      // Menus above the table hang from their bottom edge, so they stay next
      // to the table when the delete confirmation makes them shorter.
      className={`absolute z-30 flex flex-col gap-3 rounded-xl border border-border bg-panel p-3 shadow-lg ${side === "above" ? "-translate-y-full" : ""}`}
      style={{
        left: x,
        top: side === "above" ? y + MENU_HEIGHT : y,
        width: MENU_WIDTH,
      }}>
      {/* Arrow pointing at the table. */}
      <span
        aria-hidden
        className={`absolute size-3 rotate-45 border-border bg-panel ${arrowStyles[side]}`}
        style={sideways ? { top: arrowOffset } : { left: arrowOffset }}
      />

      {confirmingDelete ? (
        <div role="alert" className="flex flex-col gap-3 text-sm">
          <p>
            Delete table {table.label}
            {bookingCount > 0 &&
              ` and its ${bookingCount} ${bookingCount === 1 ? "booking" : "bookings"}`}
            ?
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              autoFocus
              onClick={() => setConfirmingDelete(false)}
              className="rounded-md border border-border bg-background py-1.5">
              Cancel
            </button>
            <button
              type="button"
              onClick={remove}
              className="rounded-md bg-conflict py-1.5 font-medium text-white">
              Delete
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1">
            <input
              aria-label="Table name"
              value={table.label}
              onFocus={() => setSavedLabel(table.label)}
              onChange={(event) => update({ label: event.target.value })}
              onBlur={() => {
                if (!table.label.trim()) update({ label: savedLabel });
              }}
              className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 font-medium outline-none hover:border-border focus:border-accent focus:bg-background"
            />
            <IconButton label="Close" onClick={close}>
              <CloseIcon />
            </IconButton>
          </div>

          <div className="flex items-center gap-1">
            <div
              role="group"
              aria-label="Shape"
              className="mr-auto flex rounded-lg border border-border bg-background p-0.5">
              {shapes.map(({ shape, label, icon }) => (
                <button
                  key={shape}
                  type="button"
                  aria-pressed={table.shape === shape}
                  onClick={() => changeShape(shape)}
                  className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    table.shape === shape
                      ? "bg-accent-subtle text-accent"
                      : "text-muted hover:text-foreground"
                  }`}>
                  {icon}
                  {label}
                </button>
              ))}
            </div>
            <IconButton label="Duplicate table" onClick={duplicate}>
              <DuplicateIcon />
            </IconButton>
            <IconButton
              label="Delete table"
              tone="danger"
              onClick={() => setConfirmingDelete(true)}>
              <DeleteIcon />
            </IconButton>
          </div>

          <label className="flex items-center gap-3 px-2 text-sm">
            <span>Chairs</span>
            <input
              type="range"
              min={1}
              max={max}
              value={table.seats}
              onChange={(event) =>
                update({ seats: Number(event.target.value) })
              }
              className="min-w-0 flex-1 accent-accent"
            />
            <span className="text-muted tabular-nums">
              {table.seats}/{max}
            </span>
          </label>
          {shapeError && (
            <p role="alert" className="-mt-1 px-2 text-xs text-conflict">
              {shapeError}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default TableMenu;
