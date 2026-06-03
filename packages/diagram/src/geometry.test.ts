import { describe, expect, it } from "vitest";
import { DISC_DIAMETER } from "./constants";
import { findBlockers, isOccluded, occlusion } from "./geometry";
import type { Disc, Point } from "./types";

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

describe("occlusion regression — playground scenario", () => {
  // Mirrors the OcclusionPanel in the playground. If the math drifts, the
  // playground numbers drift with it — and these tests catch it by name.
  const regressionShooter: Point = { x: 15, y: 459 };
  const D0: Disc = { x: 15, y: 45, color: "y" }; // closer in x=15 column
  const D1: Disc = { x: 15, y: 30, color: "b" }; // farther in x=15 column
  const D2: Disc = { x: 40, y: 100, color: "y" }; // closest in x=40 column
  const D3: Disc = { x: 40, y: 50, color: "b" }; // middle in x=40 column
  const D4: Disc = { x: 40, y: 25, color: "b" }; // farthest in x=40 column
  const D5: Disc = { x: 60, y: 100, color: "y" }; // off-line reference

  const all: Disc[] = [D0, D1, D2, D3, D4, D5];
  const others = (target: Disc) => all.filter((d) => d !== target);

  it("disc at (15, 45) — closest in x=15 column — is fully visible", () => {
    const r = occlusion(regressionShooter, D0, others(D0));
    expect(r.fraction).toBe(0);
    expect(r.blockers).toEqual([]);
  });

  it("disc at (15, 30) — directly behind (15, 45) — is fully blocked", () => {
    const r = occlusion(regressionShooter, D1, others(D1));
    expect(r.fraction).toBe(1);
    expect(r.inches).toBe(DISC_DIAMETER);
    expect(r.blockers).toEqual([D0]);
  });

  it("disc at (40, 100) — closest in x=40 column — is fully visible", () => {
    const r = occlusion(regressionShooter, D2, others(D2));
    expect(r.fraction).toBe(0);
    expect(r.blockers).toEqual([]);
  });

  it("disc at (40, 50) is partially blocked by disc at (40, 100)", () => {
    const r = occlusion(regressionShooter, D3, others(D3));
    expect(r.fraction).toBeCloseTo(0.5, 1);
    expect(r.fraction).toBeGreaterThan(0.4);
    expect(r.fraction).toBeLessThan(0.6);
    expect(r.blockers).toEqual([D2]);
  });

  it("disc at (40, 25) is unioned by both x=40 column discs ahead of it", () => {
    const r = occlusion(regressionShooter, D4, others(D4));
    expect(r.fraction).toBeCloseTo(0.78, 1);
    expect(r.fraction).toBeGreaterThan(0.7);
    expect(r.fraction).toBeLessThan(0.85);
    expect(r.blockers).toHaveLength(2);
    expect(r.blockers).toContain(D2);
    expect(r.blockers).toContain(D3);
  });

  it("disc at (60, 100) — off the line of sight — is fully visible", () => {
    const r = occlusion(regressionShooter, D5, others(D5));
    expect(r.fraction).toBe(0);
    expect(r.blockers).toEqual([]);
  });

  it("isOccluded matches occlusion-result truthiness for every disc", () => {
    for (const target of all) {
      const o = occlusion(regressionShooter, target, others(target));
      expect(isOccluded(regressionShooter, target, others(target))).toBe(
        o.fraction > 0,
      );
    }
  });
});
