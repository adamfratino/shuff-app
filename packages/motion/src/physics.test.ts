import { describe, expect, it } from "vitest";

import {
  DEFAULT_MU,
  glideDuration,
  glideLength,
  launchSpeed,
} from "./physics";

describe("friction physics", () => {
  it("launchSpeed and glideLength are inverses", () => {
    for (const dist of [1, 18, 94, 234]) {
      expect(glideLength(launchSpeed(dist))).toBeCloseTo(dist, 10);
    }
  });

  it("stopping distance is quadratic in speed", () => {
    const d1 = glideLength(50);
    const d2 = glideLength(100);
    expect(d2 / d1).toBeCloseTo(4, 10);
  });

  it("glideDuration matches √(2d/μ)", () => {
    expect(glideDuration(94)).toBeCloseTo(Math.sqrt((2 * 94) / DEFAULT_MU), 10);
  });

  it("a faster court (lower μ) glides longer for the same distance", () => {
    expect(glideDuration(100, 80)).toBeGreaterThan(glideDuration(100, 160));
  });

  it("handles zero and negative distances", () => {
    expect(glideDuration(0)).toBe(0);
    expect(glideDuration(-5)).toBe(0);
    expect(launchSpeed(0)).toBe(0);
    expect(launchSpeed(-5)).toBe(0);
  });
});
