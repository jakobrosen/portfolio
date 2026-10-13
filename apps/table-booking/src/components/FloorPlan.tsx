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
import useFloorPan from "../hooks/useFloorPan";
import useFloorZoom from "../hooks/useFloorZoom";
import ZoomControls from "./ZoomControls";

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
  zoom: number;
  onZoomChange: (zoom: number) => void;
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
  zoom: number;
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
  zoom,
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
              zoom={zoom}
            />
          )}
        </>
      )}
    </div>
  );
}

// Shown above a table while it's resized, so it's clear how many fit. It
// sits outside the zoomed content, so it keeps its size.
function SeatBadge({
  table,
  blocked,
  zoom,
}: {
  table: Table;
  blocked: boolean;
  zoom: number;
}) {
  return (
    <div
      className={`pointer-events-none absolute z-20 -translate-x-1/2 rounded-full px-2.5 py-1 text-xs whitespace-nowrap ${blocked ? "bg-conflict text-white" : "bg-foreground text-background"}`}
      style={{
        left: (table.x + table.width / 2) * zoom,
        top: (table.y - CHAIR_EXTENT) * zoom - 32,
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
  zoom,
  onZoomChange,
}: FloorPlanProps) {
  const { state, dispatch } = useAppState();
  const { setNodeRef } = useDroppable({ id: FLOOR_ID });
  const { floorRef, panning, spaceHeld, onPointerDownCapture } =
    useFloorPan(mode);
  const {
    floorRef: zoomFloorRef,
    view,
    zoomTo,
    fit,
  } = useFloorZoom(zoom, onZoomChange);
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
  // The content fills the view at any zoom, so the grid and empty floor
  // reach its edges.
  const width = Math.max(contentWidth, view.width / zoom);
  const height = Math.max(contentHeight, view.height / zoom);

  function fitTables() {
    const extent = (edge: (table: Table) => number) =>
      Math.max(0, ...tables.map((table) => edge(table) + CHAIR_EXTENT));
    fit({
      width: extent((table) => table.x + table.width),
      height: extent((table) => table.y + table.height),
    });
  }

  return (
    <>
      <main
        ref={(node) => {
          setNodeRef(node);
          floorRef.current = node;
          zoomFloorRef.current = node;
        }}
        data-floor-surface
        onPointerDownCapture={onPointerDownCapture}
        onClick={(event) => {
          // Clicking empty floor clears the selection.
          if ((event.target as Element).hasAttribute("data-floor-surface")) {
            onSelect(undefined);
          }
        }}
        // A hand shows the floor can be dragged, everywhere while space is held.
        className={`relative no-scrollbar h-full overflow-auto select-none ${panning ? "cursor-grabbing **:cursor-grabbing!" : spaceHeld ? "cursor-grab **:cursor-grab!" : "cursor-grab"}`}>
        {tables.length === 0 && (
          <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted">
            {mode === "edit"
              ? "Drag tables in from the sidebar"
              : "No tables yet. Switch to Edit layout to add some."}
          </p>
        )}
        {/* Takes up the zoomed size, so scrolling covers all of it. */}
        <div
          data-floor-surface
          className="relative"
          style={{ width: width * zoom, height: height * zoom }}>
          {/* The grid is only there to line tables up, so bookings go without it. */}
          <div
            ref={contentRef}
            data-floor-surface
            className={`absolute top-0 left-0 origin-top-left ${mode === "edit" ? "bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] bg-size-[20px_20px] bg-position-[-10px_-10px]" : ""}`}
            style={{ width, height, transform: `scale(${zoom})` }}>
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
                zoom={zoom}
              />
            ))}
          </div>
          {resizing && (
            <SeatBadge table={resizing} blocked={!resizeValid} zoom={zoom} />
          )}
          {showMenu && (
            <TableMenu
              key={selected.id}
              table={selected}
              time={time}
              mode={mode}
              onSelect={onSelect}
              zoom={zoom}
            />
          )}
        </div>
      </main>
      <ZoomControls
        zoom={zoom}
        onZoom={(next) => zoomTo(next)}
        onFit={fitTables}
      />
    </>
  );
}

export default FloorPlan;
