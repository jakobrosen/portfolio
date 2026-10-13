import { useRef, useState } from "react";
import { DndContext, DragOverlay, type Modifier } from "@dnd-kit/core";
import { getEventCoordinates } from "@dnd-kit/utilities";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import FloorPlan from "./components/FloorPlan";
import TableNode from "./components/TableNode";
import NewBookingPanel from "./components/NewBookingPanel";
import useAppState from "./state/useAppState";
import useFloorDnd from "./hooks/useFloorDnd";
import useNow from "./hooks/useNow";
import useShortcuts from "./hooks/useShortcuts";
import { statusAt } from "./lib/bookings";
import { presetTable } from "./lib/presets";
import type { Mode } from "./types";

// Keeps a new table centred on the pointer, matching where it will be dropped.
const centerOnPointer: Modifier = ({
  activatorEvent,
  draggingNodeRect,
  transform,
}) => {
  const pointer = activatorEvent && getEventCoordinates(activatorEvent);
  if (!pointer || !draggingNodeRect) return transform;
  return {
    ...transform,
    x:
      transform.x +
      pointer.x -
      draggingNodeRect.left -
      draggingNodeRect.width / 2,
    y:
      transform.y +
      pointer.y -
      draggingNodeRect.top -
      draggingNodeRect.height / 2,
  };
};

function App() {
  const { state } = useAppState();
  const now = useNow();
  const contentRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string>();
  const [hoveredId, setHoveredId] = useState<string>();
  // A moment picked in the top bar, or null to follow the clock.
  const [viewed, setViewed] = useState<Date | null>(null);
  const time = viewed ?? now;
  const [creating, setCreating] = useState(false);
  // Opens on bookings, so there's a restaurant in service to look at.
  const [mode, setMode] = useState<Mode>("booking");
  // New tables are selected right away, ready to be sized and set up.
  const { active, target, contextProps } = useFloorDnd(
    contentRef,
    setSelectedId,
  );

  function closeNewBooking() {
    setCreating(false);
    setHoveredId(undefined);
  }

  useShortcuts({
    mode,
    selected: state.tables.find((table) => table.id === selectedId),
    onSelect: setSelectedId,
    onNewBooking: () => setCreating(true),
    onEscape: () => {
      if (creating) closeNewBooking();
      else setSelectedId(undefined);
    },
  });

  return (
    <DndContext {...contextProps}>
      <div className="grid h-full grid-cols-[18rem_1fr] grid-rows-[auto_1fr]">
        <Sidebar
          mode={mode}
          onModeChange={setMode}
          time={time}
          onSelectTable={setSelectedId}
          onHoverTable={setHoveredId}
        />
        <TopBar
          time={time}
          live={viewed === null}
          now={now}
          onTimeChange={setViewed}
          creating={creating}
          onNewBooking={() =>
            creating ? closeNewBooking() : setCreating(true)
          }
        />
        <div className="relative min-h-0 min-w-0">
          <FloorPlan
            contentRef={contentRef}
            time={time}
            movingId={active?.kind === "table" ? active.table.id : undefined}
            dropTarget={target}
            selectedId={selectedId}
            onSelect={setSelectedId}
            highlightedId={hoveredId}
            mode={mode}
          />
          {creating && (
            <NewBookingPanel
              time={time}
              onHighlight={setHoveredId}
              onDone={(saved) => {
                closeNewBooking();
                // Show the new booking on its table.
                if (saved) {
                  setMode("booking");
                  setSelectedId(saved.tableId);
                }
              }}
            />
          )}
        </div>
      </div>

      {/* No drop animation, the table is already where it was dropped. */}
      <DragOverlay
        dropAnimation={null}
        modifiers={active?.kind === "preset" ? [centerOnPointer] : []}>
        {active?.kind === "preset" && (
          <div className="opacity-80">
            <TableNode
              table={presetTable(active.preset)}
              status="vacant"
              showDetails={false}
            />
          </div>
        )}
        {active?.kind === "table" && (
          <div className="opacity-80">
            <TableNode
              table={active.table}
              {...statusAt(active.table.id, state.bookings, time)}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

export default App;
