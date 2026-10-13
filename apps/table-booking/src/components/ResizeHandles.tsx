import { useRef, type PointerEvent } from "react";
import { CHAIR_EXTENT, resize, type ResizeDirection } from "../lib/geometry";
import type { Table } from "../types";

type ResizeHandlesProps = {
  // The table as currently shown, which follows the pointer while resizing.
  table: Table;
  onResize: (table: Table) => void;
  onResizeEnd: () => void;
};

const HANDLE_SIZE = 12;

const edges: ResizeDirection[] = [
  { x: -1, y: -1 },
  { x: 0, y: -1 },
  { x: 1, y: -1 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: 0 },
];
// Round tables only resize from the corners, as they grow in both directions.
const corners = edges.filter(({ x, y }) => x !== 0 && y !== 0);

const cursors: Record<string, string> = {
  "-1,-1": "cursor-nwse-resize",
  "1,1": "cursor-nwse-resize",
  "1,-1": "cursor-nesw-resize",
  "-1,1": "cursor-nesw-resize",
  "0,-1": "cursor-ns-resize",
  "0,1": "cursor-ns-resize",
  "-1,0": "cursor-ew-resize",
  "1,0": "cursor-ew-resize",
};

// Handle position relative to the box around the table and its chairs. On
// round tables the corner handles sit on the edge of the circle.
function handlePosition(table: Table, { x, y }: ResizeDirection) {
  const reach = table.shape === "round" ? Math.SQRT1_2 : 1;
  return {
    left: CHAIR_EXTENT + (table.width / 2) * (1 + x * reach) - HANDLE_SIZE / 2,
    top: CHAIR_EXTENT + (table.height / 2) * (1 + y * reach) - HANDLE_SIZE / 2,
  };
}

function ResizeHandles({ table, onResize, onResizeEnd }: ResizeHandlesProps) {
  // The pointer and table when the resize started. Sizes are worked out from
  // these, so rounding to the grid doesn't add up over many moves.
  const start = useRef<{ x: number; y: number; table: Table } | null>(null);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    // Keep the table itself from starting a drag.
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    start.current = { x: event.clientX, y: event.clientY, table };
  }

  function onPointerMove(
    event: PointerEvent<HTMLDivElement>,
    direction: ResizeDirection,
  ) {
    if (!start.current) return;
    const dx = event.clientX - start.current.x;
    const dy = event.clientY - start.current.y;
    onResize(resize(start.current.table, direction, dx, dy));
  }

  function onPointerEnd() {
    if (!start.current) return;
    start.current = null;
    onResizeEnd();
  }

  const handles = table.shape === "round" ? corners : edges;

  return handles.map((direction) => (
    <div
      key={`${direction.x},${direction.y}`}
      aria-hidden
      onPointerDown={onPointerDown}
      onPointerMove={(event) => onPointerMove(event, direction)}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      className={`absolute z-10 touch-none rounded-sm border-2 border-accent bg-table ${cursors[`${direction.x},${direction.y}`]}`}
      style={{
        ...handlePosition(table, direction),
        width: HANDLE_SIZE,
        height: HANDLE_SIZE,
      }}
    />
  ));
}

export default ResizeHandles;
