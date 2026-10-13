import { useState, type ReactNode } from "react";
import useAppState from "../state/useAppState";
import {
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
import { DeleteIcon, DuplicateIcon, RectIcon, RoundIcon } from "./icons";

type TableSettingsProps = {
  table: Table;
  onSelect: (id: string | undefined) => void;
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

// Shape, chairs, duplicate and delete for a table.
function TableSettings({ table, onSelect }: TableSettingsProps) {
  const { state, dispatch } = useAppState();
  const [shapeError, setShapeError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const max = maxSeats(table);
  const bookingCount = state.bookings.filter(
    (booking) => booking.tableId === table.id,
  ).length;

  const update = (changes: Partial<Omit<Table, "id">>) =>
    dispatch({ type: "updateTable", id: table.id, changes });

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
    onSelect(undefined);
  }

  if (confirmingDelete) {
    return (
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
    );
  }

  return (
    <div className="flex flex-col gap-3">
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
          onChange={(event) => update({ seats: Number(event.target.value) })}
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
    </div>
  );
}

export default TableSettings;
