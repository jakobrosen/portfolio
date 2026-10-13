import useAppState from "../state/useAppState";
import { createDemoState } from "../state/demo";
import TablePalette from "./TablePalette";
import IconButton from "./IconButton";
import { RedoIcon, UndoIcon } from "./icons";
import BookingList from "./BookingList";
import type { Mode } from "../types";

const modes: { mode: Mode; label: string }[] = [
  { mode: "booking", label: "Bookings" },
  { mode: "edit", label: "Edit layout" },
];

type SidebarProps = {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  time: Date;
  onSelectTable: (id: string) => void;
  onHoverTable: (id: string | undefined) => void;
};

// Switches between booking and edit mode, with the booking list or the
// table palette below.
function Sidebar({
  mode,
  onModeChange,
  time,
  onSelectTable,
  onHoverTable,
}: SidebarProps) {
  const { dispatch, canUndo, canRedo } = useAppState();
  return (
    <aside className="row-span-2 flex min-h-0 flex-col border-r border-border bg-panel">
      <div
        role="tablist"
        className="m-4 mb-0 grid shrink-0 grid-cols-2 overflow-hidden rounded-md border border-border text-sm">
        {modes.map(({ mode: id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={mode === id}
            onClick={() => onModeChange(id)}
            className={
              mode === id
                ? "bg-accent-subtle py-2 text-accent"
                : "py-2 text-muted hover:text-foreground"
            }>
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4">
        {mode === "edit" ? (
          <TablePalette />
        ) : (
          <BookingList
            time={time}
            onSelectTable={onSelectTable}
            onHoverTable={onHoverTable}
          />
        )}
      </div>

      <footer className="flex items-center gap-1 border-t border-border px-3 py-2">
        <IconButton
          label="Undo (Ctrl+Z)"
          tooltipAlign="start"
          disabled={!canUndo}
          onClick={() => dispatch({ type: "undo" })}>
          <UndoIcon />
        </IconButton>
        <IconButton
          label="Redo (Ctrl+Shift+Z)"
          tooltipAlign="start"
          disabled={!canRedo}
          onClick={() => dispatch({ type: "redo" })}>
          <RedoIcon />
        </IconButton>
        {/* Undoable, so no need to ask first. */}
        <button
          type="button"
          onClick={() => dispatch({ type: "reset", state: createDemoState() })}
          className="ml-auto rounded-md px-2 py-1 text-xs text-muted hover:bg-surface hover:text-foreground">
          Reset demo
        </button>
      </footer>
    </aside>
  );
}

export default Sidebar;
