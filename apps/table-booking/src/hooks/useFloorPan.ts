import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { Mode } from "../types";

// How far the pointer moves before a press counts as a pan, not a click.
const THRESHOLD = 4;

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  Boolean(target.closest("input, textarea, select, button, [contenteditable]"));

// Scrolls the floor plan by dragging it. In booking mode tables are locked,
// so any drag on the floor pans. In edit mode only drags from empty floor
// do, as dragging a table moves it. Holding space, or using the middle
// button, pans from anywhere, like in design tools. Touch keeps the
// browser's own scrolling.
function useFloorPan(mode: Mode) {
  const floorRef = useRef<HTMLElement | null>(null);
  const [panning, setPanning] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || isTyping(event.target)) return;
      // Keeps the page from scrolling down.
      event.preventDefault();
      setSpaceHeld(true);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") setSpaceHeld(false);
    };
    const onBlur = () => setSpaceHeld(false);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  // Runs in the capture phase, so a space or middle button pan can take
  // over before the table under the pointer starts a drag.
  function onPointerDownCapture(event: PointerEvent<HTMLElement>) {
    const floor = floorRef.current;
    if (!floor || event.pointerType === "touch") return;
    const target = event.target as Element;
    if (target.closest('[role="dialog"], button, input, select, textarea')) {
      return;
    }

    const middle = event.button === 1;
    if (event.button !== 0 && !middle) return;
    const forced = spaceHeld || middle;
    const onEmptyFloor = target.hasAttribute("data-floor-surface");
    if (!forced && mode === "edit" && !onEmptyFloor) return;
    if (forced) {
      event.stopPropagation();
      event.preventDefault();
    }

    const start = {
      x: event.clientX,
      y: event.clientY,
      left: floor.scrollLeft,
      top: floor.scrollTop,
    };
    let moved = forced;
    if (moved) setPanning(true);

    const onMove = (move: globalThis.PointerEvent) => {
      const dx = move.clientX - start.x;
      const dy = move.clientY - start.y;
      if (!moved && Math.hypot(dx, dy) < THRESHOLD) return;
      if (!moved) {
        moved = true;
        setPanning(true);
      }
      floor.scrollLeft = start.left - dx;
      floor.scrollTop = start.top - dy;
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (!moved) return;
      setPanning(false);
      // The click that ends a pan shouldn't select or deselect a table.
      const swallow = (click: MouseEvent) => {
        click.stopPropagation();
        click.preventDefault();
      };
      window.addEventListener("click", swallow, { capture: true, once: true });
      setTimeout(() =>
        window.removeEventListener("click", swallow, { capture: true }),
      );
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  return { floorRef, panning, spaceHeld, onPointerDownCapture };
}

export default useFloorPan;
