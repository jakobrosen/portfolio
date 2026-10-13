import { useEffect } from "react";
import useAppState from "../state/useAppState";
import { collides, FLOOR_MARGIN, GRID } from "../lib/geometry";
import { copyOf } from "../lib/presets";
import type { Mode, Table } from "../types";

type ShortcutOptions = {
  mode: Mode;
  selected?: Table;
  onSelect: (id: string | undefined) => void;
  onNewBooking: () => void;
  // 1 zooms in a step, -1 out, 0 back to 100%.
  onZoom: (direction: 1 | -1 | 0) => void;
  // Closes whatever is open, or clears the selection.
  onEscape: () => void;
};

const arrows: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};
// Grid steps per arrow press with Shift held.
const BIG_STEP = 5;

// Keyboard shortcuts for the whole app. Keys typed into fields are left
// alone, so undo in a text field still undoes the typing.
function useShortcuts({
  mode,
  selected,
  onSelect,
  onNewBooking,
  onZoom,
  onEscape,
}: ShortcutOptions) {
  const { state, dispatch } = useAppState();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const typing =
        event.target instanceof HTMLElement &&
        event.target.closest("input, textarea, select, [contenteditable]");
      if (event.defaultPrevented || typing) return;

      const key = event.key.toLowerCase();
      if (event.ctrlKey || event.metaKey) {
        if (key === "z" || key === "y") {
          event.preventDefault();
          const redo = key === "y" || event.shiftKey;
          dispatch({ type: redo ? "redo" : "undo" });
        }
        return;
      }
      if (event.altKey) return;

      if (key === "escape") {
        onEscape();
        return;
      }
      const zoomKeys: Record<string, 1 | -1 | 0> = {
        "+": 1,
        "=": 1,
        "-": -1,
        "0": 0,
      };
      if (event.key in zoomKeys) {
        event.preventDefault();
        onZoom(zoomKeys[event.key]);
        return;
      }
      if (key === "n") {
        event.preventDefault();
        onNewBooking();
        return;
      }
      if (mode !== "edit" || !selected) return;

      const arrow = arrows[event.key];
      if (arrow) {
        // Keeps the page from scrolling.
        event.preventDefault();
        const step = GRID * (event.shiftKey ? BIG_STEP : 1);
        const moved = {
          ...selected,
          x: Math.max(FLOOR_MARGIN, selected.x + arrow[0] * step),
          y: Math.max(FLOOR_MARGIN, selected.y + arrow[1] * step),
        };
        if (!collides(moved, state.tables)) {
          dispatch({
            type: "updateTable",
            id: selected.id,
            changes: { x: moved.x, y: moved.y },
            // A run of presses is undone in one go.
            coalesce: `move:${selected.id}`,
          });
        }
      } else if (key === "delete" || key === "backspace") {
        event.preventDefault();
        dispatch({ type: "removeTable", id: selected.id });
        onSelect(undefined);
      } else if (key === "d") {
        const copy = copyOf(selected, state.tables);
        if (copy) {
          dispatch({ type: "addTable", table: copy });
          onSelect(copy.id);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
}

export default useShortcuts;
