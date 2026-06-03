import { describe, expect, it } from "vitest";
import { DISC_DIAMETER } from "./constants";
import { findBlockers, isOccluded, occlusion } from "./geometry";

const shooter = { x: 0, y: 0 };

describe("findBlockers", () => {
  it("returns empty when there are no other discs", () => {
    const target = { x: 0, y: 100, color: "y" };
    expect(findBlockers(shooter, target, [])).toEqual([]);
  });

  it("returns a blocker on the line between shooter and target", () => {
    const target = { x: 0, y: 100, color: "y" };
    const blocker = { x: 0, y: 50, color: "y" };
    expect(findBlockers(shooter, target, [blocker])).toEqual([blocker]);
  });

  it("ignores discs that are farther from shooter than the target", () => {
    const target = { x: 0, y: 100, color: "y" };
    const behind = { x: 0, y: 150, color: "y" };
    expect(findBlockers(shooter, target, [behind])).toEqual([]);
  });

  it("ignores discs whose angular range does not overlap the target", () => {
    const target = { x: 0, y: 100, color: "y" };
    const sideways = { x: 50, y: 50, color: "y" };
    expect(findBlockers(shooter, target, [sideways])).toEqual([]);
  });

  it("returns multiple blockers when several discs are in the line", () => {
    const target = { x: 0, y: 100, color: "y" };
    const a = { x: 0, y: 30, color: "y" };
    const b = { x: 0, y: 60, color: "y" };
    expect(findBlockers(shooter, target, [a, b])).toEqual([a, b]);
  });
});

describe("isOccluded", () => {
  it("is true when a blocker covers the target", () => {
    const target = { x: 0, y: 100, color: "y" };
    const blocker = { x: 0, y: 50, color: "y" };
    expect(isOccluded(shooter, target, [blocker])).toBe(true);
  });

  it("is false when no blockers are present", () => {
    const target = { x: 0, y: 100, color: "y" };
    expect(isOccluded(shooter, target, [])).toBe(false);
  });

  it("is false when only far-end discs are present", () => {
    const target = { x: 0, y: 100, color: "y" };
    const behind = { x: 0, y: 150, color: "y" };
    expect(isOccluded(shooter, target, [behind])).toBe(false);
  });
});

describe("occlusion", () => {
  it("returns zero when there are no blockers", () => {
    const target = { x: 0, y: 100, color: "y" };
    const result = occlusion(shooter, target, []);
    expect(result.fraction).toBe(0);
    expect(result.inches).toBe(0);
    expect(result.blockers).toEqual([]);
  });

  it("returns full occlusion when the blocker is directly inline", () => {
    const target = { x: 0, y: 100, color: "y" };
    const blocker = { x: 0, y: 50, color: "y" };
    const result = occlusion(shooter, target, [blocker]);
    expect(result.fraction).toBe(1);
    expect(result.inches).toBe(DISC_DIAMETER);
    expect(result.blockers).toEqual([blocker]);
  });

  it("returns partial occlusion when the blocker is laterally offset", () => {
    const target = { x: 0, y: 200, color: "y" };
    const blocker = { x: 2, y: 100, color: "y" };
    const result = occlusion(shooter, target, [blocker]);
    expect(result.fraction).toBeGreaterThan(0);
    expect(result.fraction).toBeLessThan(1);
    expect(result.blockers).toEqual([blocker]);
  });

  it("does not double-count overlapping blockers", () => {
    const target = { x: 0, y: 100, color: "y" };
    const a = { x: 0, y: 30, color: "y" };
    const b = { x: 0, y: 60, color: "y" };
    const result = occlusion(shooter, target, [a, b]);
    expect(result.fraction).toBe(1);
    expect(result.blockers).toHaveLength(2);
  });

  it("unions side-by-side blockers when they each cover part of the target", () => {
    // Target at distance 200, two blockers at distance 50 each offset
    // perpendicularly so they overlap separate halves of the target.
    const target = { x: 0, y: 200, color: "y" };
    const left = { x: -2, y: 50, color: "y" };
    const right = { x: 2, y: 50, color: "y" };
    const result = occlusion(shooter, target, [left, right]);
    expect(result.blockers).toHaveLength(2);
    expect(result.fraction).toBe(1);
  });

  it("inches always equals fraction * DISC_DIAMETER", () => {
    const target = { x: 0, y: 200, color: "y" };
    const blocker = { x: 1, y: 100, color: "y" };
    const result = occlusion(shooter, target, [blocker]);
    expect(result.inches).toBeCloseTo(result.fraction * DISC_DIAMETER, 10);
  });
});
