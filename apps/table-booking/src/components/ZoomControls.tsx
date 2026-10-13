import { MAX_ZOOM, MIN_ZOOM, stepZoom } from "../lib/zoom";
import IconButton from "./IconButton";
import { FitIcon } from "./icons";

type ZoomControlsProps = {
  zoom: number;
  onZoom: (zoom: number) => void;
  onFit: () => void;
};

const stepClass =
  "grid size-8 place-items-center rounded-md text-lg text-muted hover:bg-surface hover:text-foreground disabled:pointer-events-none disabled:opacity-35";

// Zoom buttons in the corner of the floor plan. The percentage resets to
// 100% when clicked.
function ZoomControls({ zoom, onZoom, onFit }: ZoomControlsProps) {
  return (
    <div
      role="group"
      aria-label="Zoom"
      className="absolute right-4 bottom-4 z-20 flex items-center gap-0.5 rounded-lg border border-border bg-panel p-1 shadow-sm">
      <button
        type="button"
        aria-label="Zoom out (−)"
        disabled={zoom <= MIN_ZOOM}
        onClick={() => onZoom(stepZoom(zoom, -1))}
        className={stepClass}>
        −
      </button>
      <button
        type="button"
        aria-label="Reset zoom to 100% (0)"
        title="Reset to 100%"
        onClick={() => onZoom(1)}
        className="min-w-13 rounded-md px-1 py-1.5 text-center text-sm tabular-nums hover:bg-surface">
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        aria-label="Zoom in (+)"
        disabled={zoom >= MAX_ZOOM}
        onClick={() => onZoom(stepZoom(zoom, 1))}
        className={stepClass}>
        +
      </button>
      <span aria-hidden className="mx-0.5 h-5 w-px bg-border" />
      <IconButton label="Fit all tables" onClick={onFit}>
        <FitIcon />
      </IconButton>
    </div>
  );
}

export default ZoomControls;
