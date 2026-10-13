import useAppState from "../state/useAppState";
import useNow from "../hooks/useNow";
import { statusAt } from "../lib/bookings";
import { CHAIR_EXTENT } from "../lib/geometry";
import TableNode from "./TableNode";

// Space kept free past the furthest table, so there's room to keep building.
const PADDING = 200;

function FloorPlan() {
  const { state } = useAppState();
  const now = useNow();
  const { tables, bookings } = state;

  const contentWidth = Math.max(
    0,
    ...tables.map((table) => table.x + table.width + CHAIR_EXTENT + PADDING),
  );
  const contentHeight = Math.max(
    0,
    ...tables.map((table) => table.y + table.height + CHAIR_EXTENT + PADDING),
  );

  return (
    <main className="relative overflow-auto bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] bg-size-[20px_20px] bg-local bg-position-[-10px_-10px]">
      {tables.length === 0 && (
        <p className="absolute inset-0 grid place-items-center text-sm text-muted">
          Drag tables in from the sidebar
        </p>
      )}
      <div
        className="relative"
        style={{ width: contentWidth, height: contentHeight }}>
        {tables.map((table) => (
          <TableNode
            key={table.id}
            table={table}
            {...statusAt(table.id, bookings, now)}
          />
        ))}
      </div>
    </main>
  );
}

export default FloorPlan;
