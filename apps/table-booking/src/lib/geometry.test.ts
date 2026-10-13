import { describe, expect, it } from "vitest";
import { createDemoState } from "../state/demo";
import type { Table } from "../types";
import {
  CHAIR_EXTENT,
  chairPositions,
  collides,
  maxSeats,
  overlaps,
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
