import type { Disc } from "@shuff/core";
import { describe, expect, it } from "vitest";
import { LEFT_STARTS } from "./constants";
import { clearExposure, kitchenExposure } from "./exposure";

function disc(x: number, y: number, color = "yellow", id = "d"): Disc {
  return { x, y, color, id };
}

describe("kitchenExposure", () => {
  it("flags a naked scorer on the centerline as exposed", () => {
    const scorer = disc(36, 72); // deep in the 8, open lines everywhere
    expect(kitchenExposure(scorer, [scorer], LEFT_STARTS)).toBeGreaterThan(0.6);
  });

  it("drops to zero when every line is guarded", () => {
    const scorer = disc(36, 72);
    // One guard per opponent slot, 10" in front of the scorer along each line.
    const guards = LEFT_STARTS.map((s, i) => {
      const dx = scorer.x - s.x;
      const dy = scorer.y - s.y;
      const len = Math.hypot(dx, dy);
      return disc(
        scorer.x - (dx / len) * 10,
        scorer.y - (dy / len) * 10,
        "yellow",
        `g${i}`,
      );
    });
    expect(
      kitchenExposure(scorer, [scorer, ...guards], LEFT_STARTS),
    ).toBe(0);
  });

  it("grows with additional unblocked lines", () => {
    const scorer = disc(36, 72);
    const oneLine = kitchenExposure(scorer, [scorer], [LEFT_STARTS[0]!]);
    const threeLines = kitchenExposure(scorer, [scorer], LEFT_STARTS);
    expect(threeLines).toBeGreaterThan(oneLine);
  });
});

describe("clearExposure", () => {
  it("sees any unblocked line, kitchen-reachable or not", () => {
    const scorer = disc(10, 22); // kitchen-safe corner, still clearable
    expect(clearExposure(scorer, [scorer], LEFT_STARTS)).toBeGreaterThan(0.6);
  });

  it("drops to zero when fully guarded", () => {
    const scorer = disc(36, 72);
    const guards = LEFT_STARTS.map((s, i) => {
      const dx = scorer.x - s.x;
      const dy = scorer.y - s.y;
      const len = Math.hypot(dx, dy);
      return disc(
        scorer.x - (dx / len) * 10,
        scorer.y - (dy / len) * 10,
        "yellow",
        `g${i}`,
      );
    });
    expect(clearExposure(scorer, [scorer, ...guards], LEFT_STARTS)).toBe(0);
  });
});
