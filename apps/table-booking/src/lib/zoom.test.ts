import { describe, expect, it } from "vitest";
import { fitZoom, MAX_ZOOM, MIN_ZOOM, stepZoom, wheelZoom } from "./zoom";

describe("stepZoom", () => {
  it("steps through the levels", () => {
    expect(stepZoom(1, 1)).toBe(1.1);
    expect(stepZoom(1, -1)).toBe(0.9);
  });

  it("goes to the next level from between levels", () => {
    expect(stepZoom(1.03, 1)).toBe(1.1);
    expect(stepZoom(1.03, -1)).toBe(1);
  });

  it("stops at the limits", () => {
    expect(stepZoom(MAX_ZOOM, 1)).toBe(MAX_ZOOM);
    expect(stepZoom(MIN_ZOOM, -1)).toBe(MIN_ZOOM);
  });
});

describe("wheelZoom", () => {
  it("zooms in on scroll up and out on scroll down, within limits", () => {
    expect(wheelZoom(1, -100, 0)).toBeGreaterThan(1);
    expect(wheelZoom(1, 100, 0)).toBeLessThan(1);
    expect(wheelZoom(1, 3, 1)).toBeCloseTo(wheelZoom(1, 48, 0));
    expect(wheelZoom(1.9, -10_000, 0)).toBe(MAX_ZOOM);
  });
});

describe("fitZoom", () => {
  it("shrinks big content to fit and never zooms in past 100%", () => {
    const view = { width: 800, height: 600 };
    expect(fitZoom({ width: 1560, height: 400 }, view, 20)).toBe(0.5);
    expect(fitZoom({ width: 300, height: 200 }, view, 20)).toBe(1);
  });
});
