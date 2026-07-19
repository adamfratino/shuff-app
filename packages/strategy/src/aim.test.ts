import { describe, expect, it } from "vitest";
import {
  carrySpeed,
  distToSegment,
  exactSpeed,
  ghostBall,
  kitchenLanding,
} from "./aim";

describe("distToSegment", () => {
  it("measures perpendicular distance inside the segment", () => {
    expect(
      distToSegment({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 }),
    ).toBeCloseTo(3);
  });

  it("clamps to the nearest endpoint beyond the segment", () => {
    expect(
      distToSegment({ x: 14, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 }),
    ).toBeCloseTo(5);
  });
});

describe("ghostBall", () => {
  it("sits one diameter behind the target, opposite the destination", () => {
    const ghost = ghostBall({ x: 36, y: 72 }, { x: 36, y: 9 });
    expect(ghost).toEqual({ x: 36, y: 78 });
  });

  it("returns null when target and destination are within a diameter", () => {
    expect(ghostBall({ x: 36, y: 72 }, { x: 36, y: 70 })).toBeNull();
  });
});

describe("kitchenLanding", () => {
  it("extends a collinear ray into the kitchen", () => {
    // Straight down the center: from the shooter through a disc at the
    // apex, the extension passes through the kitchen.
    const landing = kitchenLanding({ x: 36, y: 230 }, { x: 36, y: 100 });
    expect(landing).not.toBeNull();
    expect(landing!.x).toBeCloseTo(36);
    expect(landing!.y).toBeGreaterThan(0);
    expect(landing!.y).toBeLessThan(18);
  });

  it("returns null when the extension misses the kitchen", () => {
    // Shooting at a disc near the left rail: the extension exits the
    // court's side, never reaching the kitchen trapezoid.
    expect(kitchenLanding({ x: 60, y: 230 }, { x: 10, y: 100 })).toBeNull();
  });
});

describe("speeds", () => {
  it("exactSpeed matches the friction law", () => {
    // v = √(2·160·160) = 226.27... for a 160-inch shot at μ=160
    expect(
      exactSpeed({ x: 36, y: 230 }, { x: 36, y: 70 }, 160),
    ).toBeCloseTo(Math.sqrt(2 * 160 * 160));
  });

  it("carrySpeed budgets stopping distance additively", () => {
    const start = { x: 36, y: 230 };
    const contact = { x: 36, y: 70 };
    // Carrying 40 extra inches equals an exact shot 40 inches longer.
    expect(carrySpeed(start, contact, 40, 160)).toBeCloseTo(
      exactSpeed(start, { x: 36, y: 30 }, 160),
    );
  });
});
