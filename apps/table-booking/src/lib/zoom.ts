export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2;

// The levels the zoom buttons and keys step through.
const STEPS = [0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];

export function clampZoom(zoom: number) {
  return Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM);
}

// The next level up or down from the current zoom, which can sit between
// levels after zooming with the wheel.
export function stepZoom(zoom: number, direction: 1 | -1) {
  const next =
    direction > 0
      ? STEPS.find((step) => step > zoom + 0.001)
      : STEPS.findLast((step) => step < zoom - 0.001);
  return next ?? (direction > 0 ? MAX_ZOOM : MIN_ZOOM);
}

// Zoom after a wheel or pinch event. Mouse wheels move in big steps and
// pinches in small ones, both end up as a smooth factor.
export function wheelZoom(zoom: number, deltaY: number, deltaMode: number) {
  const pixels = deltaMode === 1 ? deltaY * 16 : deltaY;
  return clampZoom(zoom * Math.exp(-pixels * 0.002));
}

// The zoom that fits content of the given size into the view, with a margin
// on each side, and never bigger than 100%.
export function fitZoom(
  content: { width: number; height: number },
  view: { width: number; height: number },
  margin: number,
) {
  const zoom = Math.min(
    (view.width - margin * 2) / content.width,
    (view.height - margin * 2) / content.height,
    1,
  );
  return clampZoom(zoom);
}
