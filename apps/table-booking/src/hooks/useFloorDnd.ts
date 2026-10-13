import { useRef, useState, type RefObject } from "react";
import {
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { getEventCoordinates } from "@dnd-kit/utilities";
import useAppState from "../state/useAppState";
import { collides, FLOOR_MARGIN, snap } from "../lib/geometry";
import { nextLabel, presetTable, type Preset } from "../lib/presets";
import type { Table } from "../types";

export const FLOOR_ID = "floor";

export type DragData =
  { kind: "preset"; preset: Preset } | { kind: "table"; table: Table };

// Where the dragged table would land, and whether it fits there.
export type DropTarget = { table: Table; valid: boolean };

type Point = { x: number; y: number };

// Drag and drop for the floor plan: new tables from the palette, and moving
// tables already placed. `contentRef` is the floor plan's scaled content,
// used with `zoom` to turn screen positions into floor plan positions.
function useFloorDnd(
  contentRef: RefObject<HTMLDivElement | null>,
  onTableAdded: (id: string) => void,
  zoom: number,
) {
  const { state, dispatch } = useAppState();
  const [active, setActive] = useState<DragData | null>(null);
  const [target, setTarget] = useState<DropTarget | null>(null);
  // Positions come from the pointer rather than dnd-kit's delta, whose
  // scroll correction can be off when the floor plan is already scrolled.
  const pointer = useRef<Point | null>(null);
  // Where the pointer holds the table, from the table's top-left corner.
  const grab = useRef<Point | null>(null);
  const stopTracking = useRef<(() => void) | null>(null);

  // A small threshold so clicking a table doesn't start a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  function dropTarget(event: DragMoveEvent): DropTarget | null {
    const data = event.active.data.current as DragData | undefined;
    const content = contentRef.current?.getBoundingClientRect();
    if (!data || !content || !pointer.current || !grab.current) return null;
    if (event.over?.id !== FLOOR_ID) return null;

    const base = data.kind === "table" ? data.table : presetTable(data.preset);
    const x = (pointer.current.x - content.left) / zoom - grab.current.x;
    const y = (pointer.current.y - content.top) / zoom - grab.current.y;
    const table = {
      ...base,
      x: Math.max(FLOOR_MARGIN, snap(x)),
      y: Math.max(FLOOR_MARGIN, snap(y)),
    };
    return { table, valid: !collides(table, state.tables) };
  }

  function reset() {
    setActive(null);
    setTarget(null);
    stopTracking.current?.();
    stopTracking.current = null;
  }

  function onDragStart(event: DragStartEvent) {
    const data = (event.active.data.current as DragData | undefined) ?? null;
    const start = getEventCoordinates(event.activatorEvent);
    const content = contentRef.current?.getBoundingClientRect();
    setActive(data);
    if (!data || !start || !content) return;

    pointer.current = start;
    // Placed tables keep the spot they were picked up by, new tables are
    // centred on the pointer.
    grab.current =
      data.kind === "table"
        ? {
            x: (start.x - content.left) / zoom - data.table.x,
            y: (start.y - content.top) / zoom - data.table.y,
          }
        : { x: data.preset.width / 2, y: data.preset.height / 2 };

    // Capture phase, so the position is current before dnd-kit handles the
    // same move.
    const track = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY };
    };
    window.addEventListener("pointermove", track, { capture: true });
    stopTracking.current = () =>
      window.removeEventListener("pointermove", track, { capture: true });
  }

  function onDragMove(event: DragMoveEvent) {
    setTarget(dropTarget(event));
  }

  function onDragEnd(event: DragEndEvent) {
    const drop = dropTarget(event);
    if (drop?.valid && active) {
      const { x, y } = drop.table;
      if (active.kind === "table") {
        dispatch({
          type: "updateTable",
          id: active.table.id,
          changes: { x, y },
        });
      } else {
        const id = crypto.randomUUID();
        dispatch({
          type: "addTable",
          table: { ...drop.table, id, label: nextLabel(state.tables) },
        });
        onTableAdded(id);
      }
    }
    reset();
  }

  return {
    active,
    target,
    contextProps: {
      sensors,
      onDragStart,
      onDragMove,
      onDragEnd,
      onDragCancel: reset,
      collisionDetection: pointerWithin,
    },
  };
}

export default useFloorDnd;
