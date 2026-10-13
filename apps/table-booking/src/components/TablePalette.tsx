import { useDraggable } from "@dnd-kit/core";
import type { DragData } from "../hooks/useFloorDnd";
import { CHAIR_EXTENT } from "../lib/geometry";
import { presets, presetTable, type Preset } from "../lib/presets";
import TableNode from "./TableNode";

// Previews are scaled to fit the tile, the biggest table sets the scale.
const TILE_SIZE = 100;
const PREVIEW_SCALE =
  TILE_SIZE /
  Math.max(
    ...presets.map((p) => Math.max(p.width, p.height) + CHAIR_EXTENT * 2),
  );

const PREVIEW_HEIGHT =
  PREVIEW_SCALE * Math.max(...presets.map((p) => p.height + CHAIR_EXTENT * 2));

const shapeNames = { round: "Round", rect: "Rectangular" };

function PresetTile({ preset }: { preset: Preset }) {
  const data: DragData = { kind: "preset", preset };
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: `preset:${preset.key}`,
    data,
  });

  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`${shapeNames[preset.shape]} table`}
      className={`flex cursor-grab touch-none flex-col items-center gap-2 rounded-lg border border-border bg-background p-3 transition-colors outline-none hover:border-accent/40 focus-visible:border-accent ${isDragging ? "opacity-50" : ""}`}>
      <div
        className="grid place-items-center"
        style={{ width: TILE_SIZE, height: PREVIEW_HEIGHT }}>
        {/* Scaling doesn't shrink the layout box, so size it explicitly. */}
        <div
          style={{
            width: (preset.width + CHAIR_EXTENT * 2) * PREVIEW_SCALE,
            height: (preset.height + CHAIR_EXTENT * 2) * PREVIEW_SCALE,
          }}>
          <div
            className="origin-top-left"
            style={{ transform: `scale(${PREVIEW_SCALE})` }}>
            <TableNode
              table={presetTable(preset)}
              status="vacant"
              showDetails={false}
            />
          </div>
        </div>
      </div>
      <span className="text-sm">{shapeNames[preset.shape]}</span>
    </li>
  );
}

function TablePalette() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        Drag a table onto the floor plan, then resize it to fit.
      </p>
      <p className="text-xs leading-relaxed text-muted">
        With a table selected, arrow keys move it (hold Shift for bigger steps),
        D duplicates it and Delete removes it.
      </p>
      <ul className="grid grid-cols-2 gap-2">
        {presets.map((preset) => (
          <PresetTile key={preset.key} preset={preset} />
        ))}
      </ul>
    </div>
  );
}

export default TablePalette;
