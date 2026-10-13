import { describe, expect, it } from "vitest";
import { createDemoState } from "../state/demo";
import type { Table } from "../types";
import {
  CHAIR_EXTENT,
  FLOOR_MARGIN,
  MAX_TABLE_SIZE,
  MIN_TABLE_SIZE,
  chairPositions,
  collides,
  findFreeSpot,
  maxSeats,
  overlaps,
  resize,
  snap,
} from "./geometry";

const rect = (width: number, height: number, seats = 4): Table => ({
  id: "r",
  label: "R",
  shape: "rect",
  x: 0,
  y: 0,
  width,
  height,
  seats,
});

const round = (size: number, seats = 4): Table => ({
  ...rect(size, size, seats),
  id: "c",
  shape: "round",
});

describe("snap", () => {
  it("rounds to the nearest grid step", () => {
    expect(snap(29)).toBe(20);
    expect(snap(31)).toBe(40);
    expect(snap(-11)).toBe(-20);
  });
});

describe("maxSeats", () => {
  it("counts chairs per side on rectangles", () => {
    expect(maxSeats(rect(120, 80))).toBe(6);
    expect(maxSeats(rect(80, 180))).toBe(8);
    expect(maxSeats(rect(240, 80))).toBe(10);
  });

  it("fits at least two chairs at the smallest size", () => {
    expect(maxSeats(rect(80, 80))).toBeGreaterThanOrEqual(2);
    expect(maxSeats(round(80))).toBeGreaterThanOrEqual(2);
  });

  it("grows with the circumference on round tables", () => {
    expect(maxSeats(round(100))).toBe(5);
    expect(maxSeats(round(140))).toBe(7);
  });

  it("allows every demo table's chair count", () => {
    for (const table of createDemoState().tables) {
      expect(table.seats).toBeLessThanOrEqual(maxSeats(table));
    }
  });
});

describe("chairPositions", () => {
  const sides = (table: Table, seats: number) =>
    chairPositions(table, seats).map((chair) => chair.angle);

  it("fills both long sides evenly before the short ones", () => {
    expect(sides(rect(120, 80), 4).sort()).toEqual([0, 0, 180, 180]);
    expect(sides(rect(80, 180), 6).sort()).toEqual([270, 270, 270, 90, 90, 90]);
    expect(sides(rect(120, 80), 6).sort()).toEqual([0, 0, 180, 180, 270, 90]);
  });

  it("never places more chairs than fit", () => {
    expect(chairPositions(rect(120, 80), 99)).toHaveLength(6);
  });

  it("places chairs just outside the table edge", () => {
    for (const chair of chairPositions(rect(120, 80), 6)) {
      const outside =
        chair.y < 0 || chair.y > 80 || chair.x < 0 || chair.x > 120;
      expect(outside).toBe(true);
      expect(chair.x).toBeGreaterThanOrEqual(-CHAIR_EXTENT);
      expect(chair.y).toBeLessThanOrEqual(80 + CHAIR_EXTENT);
    }
  });

  it("spaces chairs evenly around round tables, starting at the top", () => {
    const chairs = chairPositions(round(100), 4);
    expect(chairs.map((chair) => chair.angle)).toEqual([0, 90, 180, 270]);
    expect(chairs[0].x).toBeCloseTo(50);
    expect(chairs[0].y).toBeLessThan(0);
  });
});

describe("overlaps", () => {
  const at = (x: number, y: number): Table => ({ ...rect(120, 80), x, y });

  it("leaves room for both tables' chairs", () => {
    const gap = CHAIR_EXTENT * 2;
    expect(overlaps(at(0, 0), at(120 + gap - 1, 0))).toBe(true);
    expect(overlaps(at(0, 0), at(120 + gap, 0))).toBe(false);
  });

  it("ignores the table itself", () => {
    const table = at(0, 0);
    expect(collides(table, [table])).toBe(false);
  });

  it("finds no collisions in the demo layout", () => {
    const { tables } = createDemoState();
    expect(tables.filter((table) => collides(table, tables))).toEqual([]);
  });
});

describe("resize", () => {
  const table: Table = { ...rect(120, 80), x: 100, y: 100 };

  it("moves only the dragged edges, snapped to the grid", () => {
    expect(resize(table, { x: 1, y: 0 }, 47, 30)).toMatchObject({
      x: 100,
      width: 160,
      height: 80,
    });
    expect(resize(table, { x: -1, y: -1 }, -38, -21)).toMatchObject({
      x: 60,
      y: 80,
      width: 160,
      height: 100,
    });
  });

  it("keeps sizes within the limits and the floor margin", () => {
    expect(resize(table, { x: 1, y: 0 }, -500, 0).width).toBe(MIN_TABLE_SIZE);
    expect(resize(table, { x: 1, y: 0 }, 900, 0).width).toBe(MAX_TABLE_SIZE);
    expect(resize(table, { x: -1, y: 0 }, -300, 0)).toMatchObject({
      x: FLOOR_MARGIN,
      width: 180,
    });
  });

  it("keeps round tables round, anchored at the opposite corner", () => {
    const circle = { ...round(100), x: 200, y: 200 };
    expect(resize(circle, { x: -1, y: -1 }, -40, -10)).toMatchObject({
      x: 160,
      y: 160,
      width: 140,
      height: 140,
    });
  });

  it("drops chairs that no longer fit", () => {
    expect(resize(rect(240, 80, 8), { x: 1, y: 0 }, -160, 0).seats).toBe(4);
  });

  it("adds chairs to a full table as it grows, but not to others", () => {
    expect(resize(rect(120, 80, 6), { x: 1, y: 0 }, 60, 0).seats).toBe(8);
    expect(resize(rect(120, 80, 4), { x: 1, y: 0 }, 60, 0).seats).toBe(4);
  });
});

describe("findFreeSpot", () => {
  const original: Table = { ...rect(120, 80), id: "a", x: 100, y: 100 };

  it("finds the nearest spot that clears the original", () => {
    const spot = findFreeSpot({ ...original, id: "copy" }, [original])!;
    expect(collides(spot, [original])).toBe(false);
    // Moving straight down is the shortest way out for a wide table.
    expect(spot).toMatchObject({ x: 100, y: 220 });
  });

  it("doesn't overlap the original when given the original itself", () => {
    const spot = findFreeSpot(original, [original])!;
    expect(overlaps(spot, original)).toBe(false);
  });

  it("works around other tables", () => {
    const below: Table = { ...original, id: "b", y: 240 };
    const spot = findFreeSpot({ ...original, id: "copy" }, [original, below])!;
    expect(collides(spot, [original, below])).toBe(false);
  });
});
