import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { fitZoom, wheelZoom } from "../lib/zoom";

type Point = { x: number; y: number };

// Margin around the tables when fitting them into view.
const FIT_MARGIN = 24;

// Zooming the floor plan around a point. The wheel and trackpad pinches
// zoom around the pointer, panning is done by dragging. Other zoom changes
// keep the middle of the view in place. Also tracks the view's size, which the
// content needs to fill at any zoom.
function useFloorZoom(zoom: number, onZoomChange: (zoom: number) => void) {
  const floorRef = useRef<HTMLElement | null>(null);
  const [view, setView] = useState({ width: 0, height: 0 });
  const zoomRef = useRef(zoom);
  // Scroll position as of the last scroll event. By the time a new zoom is
  // laid out, the browser may already have clamped the live one.
  const scroll = useRef({ left: 0, top: 0 });
  // Where the next zoom change should be anchored, in view pixels, or a
  // scroll position to jump to instead.
  const pending = useRef<{ anchor?: Point; scrollTo?: Point }>({});
  // For the wheel listener, which is set up once.
  const onZoomRef = useRef(onZoomChange);
  useEffect(() => {
    onZoomRef.current = onZoomChange;
  });

  function zoomTo(next: number, anchor?: Point) {
    pending.current = { anchor };
    onZoomChange(next);
  }

  // Zooms out until the given content fits, and scrolls to its corner.
  function fit(content: { width: number; height: number }) {
    pending.current = { scrollTo: { x: 0, y: 0 } };
    onZoomChange(fitZoom(content, view, FIT_MARGIN));
  }

  useLayoutEffect(() => {
    const floor = floorRef.current;
    const before = zoomRef.current;
    zoomRef.current = zoom;
    const { anchor, scrollTo } = pending.current;
    pending.current = {};
    if (!floor || before === zoom) return;

    if (scrollTo) {
      floor.scrollLeft = scrollTo.x;
      floor.scrollTop = scrollTo.y;
    } else {
      // Keep the floor point under the anchor where it was.
      const at = anchor ?? {
        x: floor.clientWidth / 2,
        y: floor.clientHeight / 2,
      };
      floor.scrollLeft = ((scroll.current.left + at.x) / before) * zoom - at.x;
      floor.scrollTop = ((scroll.current.top + at.y) / before) * zoom - at.y;
    }
    scroll.current = { left: floor.scrollLeft, top: floor.scrollTop };
  }, [zoom]);

  useEffect(() => {
    const floor = floorRef.current;
    if (!floor) return;

    const onScroll = () => {
      scroll.current = { left: floor.scrollLeft, top: floor.scrollTop };
    };
    // Not passive, as zooming has to stop the floor from scrolling, and the
    // page from zooming on a pinch.
    const onWheel = (event: WheelEvent) => {
      // Menus on the floor keep the wheel to themselves.
      if ((event.target as Element).closest('[role="dialog"]')) return;
      event.preventDefault();
      const rect = floor.getBoundingClientRect();
      pending.current = {
        anchor: { x: event.clientX - rect.left, y: event.clientY - rect.top },
      };
      onZoomRef.current(
        wheelZoom(zoomRef.current, event.deltaY, event.deltaMode),
      );
    };
    const observer = new ResizeObserver(() =>
      setView({ width: floor.clientWidth, height: floor.clientHeight }),
    );

    floor.addEventListener("scroll", onScroll);
    floor.addEventListener("wheel", onWheel, { passive: false });
    observer.observe(floor);
    return () => {
      floor.removeEventListener("scroll", onScroll);
      floor.removeEventListener("wheel", onWheel);
      observer.disconnect();
    };
  }, []);

  return { floorRef, view, zoomTo, fit };
}

export default useFloorZoom;
