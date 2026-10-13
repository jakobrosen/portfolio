import TablePalette from "./TablePalette";
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
  return (
    <aside className="row-span-2 flex flex-col gap-4 overflow-x-hidden overflow-y-auto border-r border-border bg-panel p-4">
      <div
        role="tablist"
        className="grid shrink-0 grid-cols-2 overflow-hidden rounded-md border border-border text-sm">
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

      {mode === "edit" ? (
        <TablePalette />
      ) : (
        <BookingList
          time={time}
          onSelectTable={onSelectTable}
          onHoverTable={onHoverTable}
        />
      )}
    </aside>
  );
}

export default Sidebar;
