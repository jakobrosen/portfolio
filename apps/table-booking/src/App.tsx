import { useRef, useState } from "react";
import { DndContext, DragOverlay, type Modifier } from "@dnd-kit/core";
import { getEventCoordinates } from "@dnd-kit/utilities";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import FloorPlan from "./components/FloorPlan";
import TableNode from "./components/TableNode";
import useAppState from "./state/useAppState";
import useFloorDnd from "./hooks/useFloorDnd";
import useNow from "./hooks/useNow";
import { statusAt } from "./lib/bookings";
import { presetTable } from "./lib/presets";

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
  // New tables are selected right away, ready to be resized.
  const { active, target, contextProps } = useFloorDnd(
    contentRef,
    setSelectedId,
  );

  return (
    <DndContext {...contextProps}>
      <div className="grid h-full grid-cols-[18rem_1fr] grid-rows-[auto_1fr]">
        <Sidebar />
        <TopBar />
        <FloorPlan
          contentRef={contentRef}
          time={now}
          movingId={active?.kind === "table" ? active.table.id : undefined}
          dropTarget={target}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
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
              {...statusAt(active.table.id, state.bookings, now)}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

export default App;
