import { describe, expect, it } from "vitest";
import {
  APEX,
  DISC_RADIUS,
  FULL_COURT_LENGTH,
  HALF_COURT_WIDTH,
} from "./constants";
import {
  closestToApex,
  discsTouching,
  distance,
  mirrorEnd,
  mirrorSide,
} from "./spatial";
import type { Disc } from "./types";

describe("distance", () => {
  it("returns 0 for identical points", () => {
    expect(distance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
  });

  it("is symmetric", () => {
    const a = { x: 1, y: 2 };
    const b = { x: 4, y: 6 };
    expect(distance(a, b)).toBe(distance(b, a));
  });

  it("computes Euclidean distance for a 3-4-5 triangle", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});

describe("closestToApex", () => {
  it("returns null for an empty list", () => {
    expect(closestToApex([])).toBeNull();
  });

  it("returns the only disc when there's one", () => {
    const d: Disc = { x: 0, y: 0, color: "y" };
    expect(closestToApex([d])).toBe(d);
  });

  it("returns the disc nearest the apex (36, 126)", () => {
    const near: Disc = { x: APEX.x, y: APEX.y - 5, color: "y" };
    const far: Disc = { x: 0, y: 0, color: "y" };
    expect(closestToApex([far, near])).toBe(near);
  });

  it("breaks ties by input order", () => {
    const first: Disc = { x: APEX.x, y: APEX.y - 10, color: "y" };
    const second: Disc = { x: APEX.x, y: APEX.y + 10, color: "b" };
    expect(closestToApex([first, second])).toBe(first);
  });
});

describe("discsTouching", () => {
  it("is true for two discs in contact (centers exactly 2 * radius apart)", () => {
    const a: Disc = { x: 0, y: 0, color: "y" };
    const b: Disc = { x: 2 * DISC_RADIUS, y: 0, color: "b" };
    expect(discsTouching(a, b)).toBe(true);
  });

  it("is true for two discs at the same point", () => {
    const a: Disc = { x: 10, y: 10, color: "y" };
    const b: Disc = { x: 10, y: 10, color: "b" };
    expect(discsTouching(a, b)).toBe(true);
  });

  it("is false for discs farther apart than the diameter", () => {
    const a: Disc = { x: 0, y: 0, color: "y" };
    const b: Disc = { x: 2 * DISC_RADIUS + 0.1, y: 0, color: "b" };
    expect(discsTouching(a, b)).toBe(false);
  });
});

describe("mirrorEnd", () => {
  it("reflects y across the full-court center (y = 234)", () => {
    expect(mirrorEnd({ x: 10, y: 0 })).toEqual({ x: 10, y: FULL_COURT_LENGTH });
    expect(mirrorEnd({ x: 10, y: FULL_COURT_LENGTH })).toEqual({ x: 10, y: 0 });
    expect(mirrorEnd({ x: 10, y: FULL_COURT_LENGTH / 2 })).toEqual({
      x: 10,
      y: FULL_COURT_LENGTH / 2,
    });
  });

  it("preserves extra fields on a Disc", () => {
    const d: Disc = { x: 20, y: 50, color: "#f5c518" };
    const mirrored = mirrorEnd(d);
    expect(mirrored.color).toBe("#f5c518");
    expect(mirrored.x).toBe(20);
    expect(mirrored.y).toBe(FULL_COURT_LENGTH - 50);
  });

  it("is its own inverse", () => {
    const d: Disc = { x: 17, y: 89, color: "y" };
    expect(mirrorEnd(mirrorEnd(d))).toEqual(d);
  });
});

describe("mirrorSide", () => {
  it("reflects x across the longitudinal centerline (x = 36)", () => {
    expect(mirrorSide({ x: 0, y: 100 })).toEqual({
      x: HALF_COURT_WIDTH,
      y: 100,
    });
    expect(mirrorSide({ x: HALF_COURT_WIDTH, y: 100 })).toEqual({
      x: 0,
      y: 100,
    });
    expect(mirrorSide({ x: HALF_COURT_WIDTH / 2, y: 100 })).toEqual({
      x: HALF_COURT_WIDTH / 2,
      y: 100,
    });
  });

  it("preserves color on a Disc", () => {
    const d: Disc = { x: 20, y: 50, color: "yellow" };
    expect(mirrorSide(d).color).toBe("yellow");
  });

  it("is its own inverse", () => {
    const d: Disc = { x: 17, y: 89, color: "y" };
    expect(mirrorSide(mirrorSide(d))).toEqual(d);
  });
});
