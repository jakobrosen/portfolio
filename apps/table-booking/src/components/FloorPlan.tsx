import { useEffect, useRef, useState, type RefObject } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import useAppState from "../state/useAppState";
import { FLOOR_ID, type DragData, type DropTarget } from "../hooks/useFloorDnd";
import { statusAt } from "../lib/bookings";
import { CHAIR_EXTENT, collides, maxSeats } from "../lib/geometry";
import type { Booking, Mode, Table } from "../types";
import TableNode from "./TableNode";
import ResizeHandles from "./ResizeHandles";
import TableMenu from "./TableMenu";

// Space kept free past the furthest table, so there's room to keep building.
const PADDING = 200;

type FloorPlanProps = {
  contentRef: RefObject<HTMLDivElement | null>;
  // The moment table statuses are shown for.
  time: Date;
  // The table being dragged, which fades out until it's dropped.
  movingId?: string;
  dropTarget: DropTarget | null;
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
  // A table pointed at from elsewhere, like the booking list.
  highlightedId?: string;
  // Tables can only be moved and resized in edit mode.
  mode: Mode;
};

type PlacedTableProps = {
  table: Table;
  bookings: Booking[];
  time: Date;
  moving: boolean;
  selected: boolean;
  highlighted: boolean;
  editable: boolean;
  // True while a resize would run into another table.
  blocked: boolean;
  onSelect: () => void;
  onResize: (table: Table) => void;
  onResizeEnd: () => void;
};

function PlacedTable({
  table,
  bookings,
  time,
  moving,
  selected,
  highlighted,
  editable,
  blocked,
  onSelect,
  onResize,
  onResizeEnd,
}: PlacedTableProps) {
  const data: DragData = { kind: "table", table };
  const { setNodeRef, attributes, listeners } = useDraggable({
    id: table.id,
    data,
    disabled: !editable,
  });
  // Locked tables are plain buttons, without drag handling.
  const dragProps = editable
    ? { ...attributes, ...listeners }
    : { role: "button", tabIndex: 0 };
  const nodeRef = useRef<HTMLDivElement | null>(null);

  // Tables picked from the booking list can be out of view.
  useEffect(() => {
    if (selected) {
      nodeRef.current?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: "smooth",
      });
    }
  }, [selected]);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        nodeRef.current = node;
      }}
      {...dragProps}
      aria-label={`Table ${table.label}`}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (editable) listeners?.onKeyDown?.(event);
        if (event.key === "Enter") onSelect();
      }}
      className={`absolute ${editable ? "cursor-grab touch-none" : "cursor-pointer"} rounded-lg outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent ${moving ? "opacity-30" : ""} ${selected ? "z-10" : ""}`}
      style={{ left: table.x - CHAIR_EXTENT, top: table.y - CHAIR_EXTENT }}>
      <TableNode table={table} {...statusAt(table.id, bookings, time)} />
      {highlighted && !selected && (
        <div
          className={`pointer-events-none absolute border-2 border-dashed border-accent ${table.shape === "round" ? "rounded-full" : "rounded-xl"}`}
          style={{
            left: CHAIR_EXTENT - 4,
            top: CHAIR_EXTENT - 4,
            width: table.width + 8,
            height: table.height + 8,
          }}
        />
      )}
      {selected && (
        <>
          <div
            className={`pointer-events-none absolute border-2 ${blocked ? "border-conflict" : "border-accent"} ${table.shape === "round" ? "rounded-full" : "rounded-xl"}`}
            style={{
              left: CHAIR_EXTENT - 4,
              top: CHAIR_EXTENT - 4,
              width: table.width + 8,
              height: table.height + 8,
            }}
          />
          {editable && (
            <ResizeHandles
              table={table}
              onResize={onResize}
              onResizeEnd={onResizeEnd}
            />
          )}
        </>
      )}
    </div>
  );
}

// Shown above a table while it's resized, so it's clear how many fit.
function SeatBadge({ table, blocked }: { table: Table; blocked: boolean }) {
  return (
    <div
      className={`pointer-events-none absolute z-20 -translate-x-1/2 rounded-full px-2.5 py-1 text-xs whitespace-nowrap ${blocked ? "bg-conflict text-white" : "bg-foreground text-background"}`}
      style={{
        left: table.x + table.width / 2,
        top: table.y - CHAIR_EXTENT - 32,
      }}>
      {blocked ? "Too close to another table" : `Fits ${maxSeats(table)} seats`}
    </div>
  );
}

// Outline showing where a dragged table will land, red if it doesn't fit.
function DropOutline({ target }: { target: DropTarget }) {
  const { table, valid } = target;
  return (
    <div
      className={`pointer-events-none absolute border-2 border-dashed ${table.shape === "round" ? "rounded-full" : "rounded-lg"} ${valid ? "border-accent bg-accent-subtle/60" : "border-conflict bg-conflict/10"}`}
      style={{
        left: table.x,
        top: table.y,
        width: table.width,
        height: table.height,
      }}
    />
  );
}

function FloorPlan({
  contentRef,
  time,
  movingId,
  dropTarget,
  selectedId,
  onSelect,
  highlightedId,
  mode,
}: FloorPlanProps) {
  const { state, dispatch } = useAppState();
  const { setNodeRef } = useDroppable({ id: FLOOR_ID });
  // The table being resized, shown in place of the saved one until released.
  const [resizing, setResizing] = useState<Table | null>(null);
  const resizeValid = resizing ? !collides(resizing, state.tables) : true;

  const tables = state.tables.map((table) =>
    table.id === resizing?.id ? resizing : table,
  );
  const { bookings } = state;
  // The menu steps aside while the table is moved or resized.
  const selected = tables.find((table) => table.id === selectedId);
  const showMenu = selected && !resizing && selected.id !== movingId;

  // A resize that would run into another table is dropped.
  function finishResize() {
    if (resizing && resizeValid) {
      const { id, x, y, width, height, seats } = resizing;
      dispatch({
        type: "updateTable",
        id,
        changes: { x, y, width, height, seats },
      });
    }
    setResizing(null);
  }

  const furthest = (edge: (table: Table) => number) =>
    Math.max(0, ...tables.map((table) => edge(table) + CHAIR_EXTENT + PADDING));
  const contentWidth = furthest((table) => table.x + table.width);
  const contentHeight = furthest((table) => table.y + table.height);

  return (
    <main
      ref={setNodeRef}
      onClick={(event) => {
        // Clicking empty floor clears the selection.
        if (
          event.target === event.currentTarget ||
          event.target === contentRef.current
        ) {
          onSelect(undefined);
        }
      }}
      className="relative h-full overflow-auto bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] bg-size-[20px_20px] bg-local bg-position-[-10px_-10px]">
      {tables.length === 0 && (
        <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted">
          {mode === "edit"
            ? "Drag tables in from the sidebar"
            : "No tables yet. Switch to Edit layout to add some."}
        </p>
      )}
      <div
        ref={contentRef}
        className="relative min-h-full min-w-full"
        style={{ width: contentWidth, height: contentHeight }}>
        {dropTarget && <DropOutline target={dropTarget} />}
        {tables.map((table) => (
          <PlacedTable
            key={table.id}
            table={table}
            bookings={bookings}
            time={time}
            moving={table.id === movingId}
            selected={table.id === selectedId}
            highlighted={table.id === highlightedId}
            editable={mode === "edit"}
            blocked={table.id === resizing?.id && !resizeValid}
            onSelect={() => onSelect(table.id)}
            onResize={setResizing}
            onResizeEnd={finishResize}
          />
        ))}
        {resizing && <SeatBadge table={resizing} blocked={!resizeValid} />}
        {showMenu && (
          <TableMenu
            key={selected.id}
            table={selected}
            time={time}
            mode={mode}
            onSelect={onSelect}
          />
        )}
      </div>
    </main>
  );
}

export default FloorPlan;
