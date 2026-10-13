import type { Table } from "../types";

// All sizes are in floor plan units, roughly 1 unit = 1 cm.
export const GRID = 20;
export const MIN_TABLE_SIZE = 80;
export const MAX_TABLE_SIZE = 400;
// Closest a table may sit to the floor plan's top and left edges, leaving
// room for its chairs.
export const FLOOR_MARGIN = 40;

// Space each chair needs along a table edge.
export const SEAT_PITCH = 60;
export const CHAIR_WIDTH = 36;
export const CHAIR_DEPTH = 20;
export const CHAIR_GAP = 6;
// How far chairs stick out from the table edge.
export const CHAIR_EXTENT = CHAIR_GAP + CHAIR_DEPTH;

type Side = "top" | "right" | "bottom" | "left";

export type Chair = {
  // Center of the chair, relative to the table's top-left corner.
  x: number;
  y: number;
  // Degrees clockwise, 0 means the backrest faces up.
  angle: number;
};

export function snap(value: number, step = GRID) {
  return Math.round(value / step) * step;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const seatsAlong = (length: number) => Math.floor(length / SEAT_PITCH);

// How many chairs fit on each side, long sides first.
function sideCapacities(table: Table): [Side, number][] {
  const { width, height } = table;
  const sides: [Side, number][] = [
    ["top", seatsAlong(width)],
    ["bottom", seatsAlong(width)],
    ["left", seatsAlong(height)],
    ["right", seatsAlong(height)],
  ];
  return width >= height ? sides : [sides[2], sides[3], sides[0], sides[1]];
}

export function maxSeats(table: Table) {
  if (table.shape === "round") {
    return Math.floor((Math.PI * table.width) / SEAT_PITCH);
  }
  return sideCapacities(table).reduce((sum, [, n]) => sum + n, 0);
}

export function chairPositions(table: Table, seats = table.seats): Chair[] {
  const count = clamp(seats, 0, maxSeats(table));
  const { width, height } = table;

  if (table.shape === "round") {
    const radius = width / 2 + CHAIR_GAP + CHAIR_DEPTH / 2;
    return Array.from({ length: count }, (_, i) => {
      const angle = (360 / count) * i;
      const radians = ((angle - 90) * Math.PI) / 180;
      return {
        x: width / 2 + radius * Math.cos(radians),
        y: height / 2 + radius * Math.sin(radians),
        angle,
      };
    });
  }

  // Fill the long sides first, then the short ones. Chairs are dealt to
  // opposite sides in turn so the table stays balanced.
  const capacities = sideCapacities(table);
  const perSide = new Map<Side, number>(capacities.map(([side]) => [side, 0]));
  let left = count;
  for (const pair of [capacities.slice(0, 2), capacities.slice(2)]) {
    while (left > 0 && pair.some(([side, cap]) => perSide.get(side)! < cap)) {
      for (const [side, cap] of pair) {
        if (left > 0 && perSide.get(side)! < cap) {
          perSide.set(side, perSide.get(side)! + 1);
          left--;
        }
      }
    }
  }

  const offset = CHAIR_GAP + CHAIR_DEPTH / 2;
  const spread = (n: number, length: number) =>
    Array.from({ length: n }, (_, i) => (length * (i + 0.5)) / n);

  return [
    ...spread(perSide.get("top")!, width).map((x) => ({
      x,
      y: -offset,
      angle: 0,
    })),
    ...spread(perSide.get("right")!, height).map((y) => ({
      x: width + offset,
      y,
      angle: 90,
    })),
    ...spread(perSide.get("bottom")!, width).map((x) => ({
      x,
      y: height + offset,
      angle: 180,
    })),
    ...spread(perSide.get("left")!, height).map((y) => ({
      x: -offset,
      y,
      angle: 270,
    })),
  ];
}

// Tables collide when their chair areas would touch.
export function overlaps(a: Table, b: Table) {
  const gap = CHAIR_EXTENT * 2;
  return (
    a.x < b.x + b.width + gap &&
    b.x < a.x + a.width + gap &&
    a.y < b.y + b.height + gap &&
    b.y < a.y + a.height + gap
  );
}

export function collides(table: Table, tables: Table[]) {
  return tables.some(
    (other) => other.id !== table.id && overlaps(table, other),
  );
}

// Which edges a resize handle moves: -1 for left/top, 1 for right/bottom.
export type ResizeDirection = { x: -1 | 0 | 1; y: -1 | 0 | 1 };

// The table resized by dragging a handle (dx, dy). The opposite edges stay
// put, sizes snap to the grid and round tables stay round. A table that had
// every chair it could fit keeps filling up as it grows.
export function resize(
  table: Table,
  direction: ResizeDirection,
  dx: number,
  dy: number,
): Table {
  const right = table.x + table.width;
  const bottom = table.y + table.height;
  // Growing left or up stops at the floor plan's margin.
  const maxWidth = Math.min(
    MAX_TABLE_SIZE,
    direction.x < 0 ? right - FLOOR_MARGIN : MAX_TABLE_SIZE,
  );
  const maxHeight = Math.min(
    MAX_TABLE_SIZE,
    direction.y < 0 ? bottom - FLOOR_MARGIN : MAX_TABLE_SIZE,
  );
  const fit = (size: number, max: number) =>
    clamp(snap(size), MIN_TABLE_SIZE, max);

  let { width, height } = table;
  if (table.shape === "round") {
    const change =
      Math.abs(dx) > Math.abs(dy) ? dx * direction.x : dy * direction.y;
    width = height = fit(table.width + change, Math.min(maxWidth, maxHeight));
  } else {
    if (direction.x) width = fit(table.width + dx * direction.x, maxWidth);
    if (direction.y) height = fit(table.height + dy * direction.y, maxHeight);
  }

  const resized = {
    ...table,
    x: direction.x < 0 ? right - width : table.x,
    y: direction.y < 0 ? bottom - height : table.y,
    width,
    height,
  };
  const wasFull = table.seats >= maxSeats(table);
  const fits = maxSeats(resized);
  return { ...resized, seats: wasFull ? fits : Math.min(table.seats, fits) };
}

// How far from the original spot to look for room, in grid steps.
const SEARCH_RADIUS = 40;

// The free spot closest to where the table is now, other than that spot
// itself. Used to place a copy of a table next to the original.
export function findFreeSpot(table: Table, tables: Table[]) {
  const candidates: Table[] = [];
  for (let dy = -SEARCH_RADIUS; dy <= SEARCH_RADIUS; dy++) {
    for (let dx = -SEARCH_RADIUS; dx <= SEARCH_RADIUS; dx++) {
      const x = table.x + dx * GRID;
      const y = table.y + dy * GRID;
      if ((dx || dy) && x >= FLOOR_MARGIN && y >= FLOOR_MARGIN) {
        candidates.push({ ...table, x, y });
      }
    }
  }

  const distance = (spot: Table) =>
    Math.hypot(spot.x - table.x, spot.y - table.y);
  candidates.sort((a, b) => distance(a) - distance(b));
  // Checked against every table, the original included, since the copy
  // still has the original's id at this point.
  return (
    candidates.find((spot) => !tables.some((other) => overlaps(spot, other))) ??
    null
  );
}

export type MenuSide = "right" | "left" | "below" | "above";

// Gap between a menu and the table's chairs.
const MENU_GAP = 12;
// Closest a menu may sit to the floor plan's top and left edges.
const MENU_MARGIN = 8;

// How far in from a menu's corners its arrow has to stay.
export const MENU_ARROW_INSET = 18;
// Step when sliding a menu along a side of the table.
const MENU_SLIDE_STEP = 20;

// Where to put a menu of the given size next to a table: the spot that
// covers the least of the other tables. Each side is tried centred on the
// table and then slid along it, as far as the arrow can still point at the
// table. Ties go to the right, left, below and above, in that order, and to
// spots closer to centred.
export function placeMenu(
  table: Table,
  tables: Table[],
  size: { width: number; height: number },
) {
  const reach = CHAIR_EXTENT + MENU_GAP;
  const centerX = table.x + table.width / 2;
  const centerY = table.y + table.height / 2;

  // Start positions along a side, centred first and then further out.
  const slides = (center: number, length: number) => {
    const centred = center - length / 2;
    const room = length / 2 - MENU_ARROW_INSET;
    const steps = Math.floor(room / MENU_SLIDE_STEP);
    const starts = [centred];
    for (let i = 1; i <= steps; i++) {
      starts.push(centred - i * MENU_SLIDE_STEP, centred + i * MENU_SLIDE_STEP);
    }
    return starts;
  };

  const spots: { side: MenuSide; x: number; y: number }[] = [
    ...slides(centerY, size.height).map((y) => ({
      side: "right" as const,
      x: table.x + table.width + reach,
      y,
    })),
    ...slides(centerY, size.height).map((y) => ({
      side: "left" as const,
      x: table.x - reach - size.width,
      y,
    })),
    ...slides(centerX, size.width).map((x) => ({
      side: "below" as const,
      x,
      y: table.y + table.height + reach,
    })),
    ...slides(centerX, size.width).map((x) => ({
      side: "above" as const,
      x,
      y: table.y - reach - size.height,
    })),
  ];

  // How much of the other tables, chairs included, the menu would cover.
  const covered = ({ x, y }: { x: number; y: number }) => {
    if (x < MENU_MARGIN || y < MENU_MARGIN) return Infinity;
    return tables
      .filter((other) => other.id !== table.id)
      .reduce((sum, other) => {
        const overlapX =
          Math.min(x + size.width, other.x + other.width + CHAIR_EXTENT) -
          Math.max(x, other.x - CHAIR_EXTENT);
        const overlapY =
          Math.min(y + size.height, other.y + other.height + CHAIR_EXTENT) -
          Math.max(y, other.y - CHAIR_EXTENT);
        return sum + Math.max(0, overlapX) * Math.max(0, overlapY);
      }, 0);
  };

  // The first spot wins ties, so the order above is the preference.
  return spots.reduce((best, spot) =>
    covered(spot) < covered(best) ? spot : best,
  );
}
