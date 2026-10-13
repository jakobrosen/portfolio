import { useState } from "react";
import useAppState from "../state/useAppState";
import {
  CHAIR_EXTENT,
  clamp,
  collides,
  findFreeSpot,
  maxSeats,
  MAX_TABLE_SIZE,
  MIN_TABLE_SIZE,
  snap,
} from "../lib/geometry";
import { nextLabel } from "../lib/presets";
import type { Table, TableShape } from "../types";
import IconButton from "./IconButton";
import { CloseIcon, DeleteIcon, DuplicateIcon } from "./icons";

type TableMenuProps = {
  table: Table;
  onSelect: (id: string | undefined) => void;
};

const MENU_WIDTH = 288;
// Gap between the menu and the table's chairs.
const GAP = 12;
// Rough height of the menu. Tables closer than this to the top of the floor
// plan get their menu below instead of above.
const MENU_HEIGHT = 200;

const shapes: { shape: TableShape; label: string }[] = [
  { shape: "rect", label: "Rectangular" },
  { shape: "round", label: "Round" },
];

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

  const below = table.y - CHAIR_EXTENT < MENU_HEIGHT + GAP;
  const centerX = table.x + table.width / 2;
  const left = Math.max(8, centerX - MENU_WIDTH / 2);

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
      className={`absolute z-30 flex flex-col gap-3 rounded-xl border border-border bg-panel p-3 shadow-lg ${below ? "" : "-translate-y-full"}`}
      style={{
        left,
        width: MENU_WIDTH,
        top: below
          ? table.y + table.height + CHAIR_EXTENT + GAP
          : table.y - CHAIR_EXTENT - GAP,
      }}>
      {/* Arrow pointing at the table. */}
      <span
        aria-hidden
        className={`absolute size-3 rotate-45 border-border bg-panel ${below ? "-top-1.5 border-t border-l" : "-bottom-1.5 border-r border-b"}`}
        style={{ left: centerX - left - 6 }}
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
              className="mr-1 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 font-medium outline-none hover:border-border focus:border-accent focus:bg-background"
            />
            <IconButton label="Duplicate table" onClick={duplicate}>
              <DuplicateIcon />
            </IconButton>
            <IconButton
              label="Delete table"
              tone="danger"
              onClick={() => setConfirmingDelete(true)}>
              <DeleteIcon />
            </IconButton>
            <IconButton label="Close" onClick={close}>
              <CloseIcon />
            </IconButton>
          </div>

          <div className="grid grid-cols-2 overflow-hidden rounded-md border border-border text-sm">
            {shapes.map(({ shape, label }) => (
              <button
                key={shape}
                type="button"
                aria-pressed={table.shape === shape}
                onClick={() => changeShape(shape)}
                className={
                  table.shape === shape
                    ? "bg-accent-subtle py-1.5 text-accent"
                    : "bg-background py-1.5 text-muted hover:text-foreground"
                }>
                {label}
              </button>
            ))}
          </div>
          {shapeError && (
            <p role="alert" className="-mt-1 text-xs text-conflict">
              {shapeError}
            </p>
          )}

          <label className="flex flex-col gap-1 text-sm">
            <span className="flex justify-between">
              <span>Chairs</span>
              <span className="text-muted tabular-nums">
                {table.seats} of {max}
              </span>
            </span>
            <input
              type="range"
              min={1}
              max={max}
              value={table.seats}
              onChange={(event) =>
                update({ seats: Number(event.target.value) })
              }
              className="accent-accent"
            />
          </label>
        </>
      )}
    </div>
  );
}

export default TableMenu;
