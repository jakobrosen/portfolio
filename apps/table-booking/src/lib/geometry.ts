import type { Table } from "../types";

// All sizes are in floor plan units, roughly 1 unit = 1 cm.
export const GRID = 20;
export const MIN_TABLE_SIZE = 80;
export const MAX_TABLE_SIZE = 400;

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
