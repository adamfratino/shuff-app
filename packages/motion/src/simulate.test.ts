import type { Disc, Point } from "@shuff/core";
import { describe, expect, it } from "vitest";
import { launchSpeed } from "./physics";
import { simulateShot } from "./simulate";

/** Mid-kitchen release point at the shooting end (matches strategy's SHOOTING_Y). */
const SHOOTING_Y = 230;
const START = { x: 36, y: SHOOTING_Y };
const YELLOW = { color: "yellow", id: "shooter" };

/** Launch speed that stops the shooter's disc exactly at `aim`. */
const exactSpeed = (start: Point, aim: Point) =>
  launchSpeed(Math.hypot(aim.x - start.x, aim.y - start.y));

function disc(x: number, y: number, color = "black", id = "b1"): Disc {
  return { x, y, color, id };
}

describe("simulateShot", () => {
  it("stops an unobstructed shot at its aim point", () => {
    const aim = { x: 36, y: 104 };
    const { shooter } = simulateShot(
      [],
      { start: START, aim, speed: exactSpeed(START, aim) },
      YELLOW,
    );
    expect(shooter).not.toBeNull();
    expect(shooter!.x).toBeCloseTo(36, 0);
    expect(Math.abs(shooter!.y - 104)).toBeLessThan(2);
  });

  it("sticks the shooter on a dead-center hit and moves the target on", () => {
    const target = disc(36, 104);
    // Aim dead through the target with carry: full transfer of the normal
    // component — shooter stays near the contact point, target glides on.
    const { board, shooter } = simulateShot(
      [target],
      { start: START, aim: { x: 36, y: 104 }, speed: exactSpeed(START, { x: 36, y: 40 }) },
      YELLOW,
    );
    const struck = board.find((d) => d.id === "b1");
    expect(shooter).not.toBeNull();
    expect(struck).toBeDefined();
    // Shooter stopped within a couple inches of the contact point.
    expect(Math.abs(shooter!.y - (104 + 6))).toBeLessThan(3);
    // Target carried up-court by the transferred speed.
    expect(struck!.y).toBeLessThan(80);
  });

  it("kills a disc driven off the back baseline", () => {
    const target = disc(36, 30);
    const { board, dead } = simulateShot(
      [target],
      // Hard shot straight through: enough carry to push it past y = 0.
      { start: START, aim: { x: 36, y: 30 }, speed: exactSpeed(START, { x: 36, y: 30 }) * 1.5 },
      YELLOW,
    );
    expect(dead.some((d) => d.id === "b1")).toBe(true);
    expect(board.some((d) => d.id === "b1")).toBe(false);
  });

  it("kills a shot that stops short of the lag line", () => {
    const aim = { x: 36, y: 200 }; // rest at y=200 > lag line 162 → dead
    const { shooter, dead } = simulateShot(
      [],
      { start: START, aim, speed: exactSpeed(START, aim) },
      YELLOW,
    );
    expect(shooter).toBeNull();
    expect(dead).toHaveLength(1);
  });

  it("leaves untouched discs exactly where they were", () => {
    const bystander = disc(60, 40, "black", "still");
    const aim = { x: 20, y: 104 };
    const { board } = simulateShot(
      [bystander],
      { start: { x: 21, y: SHOOTING_Y }, aim, speed: exactSpeed({ x: 21, y: SHOOTING_Y }, aim) },
      YELLOW,
    );
    const after = board.find((d) => d.id === "still");
    expect(after).toMatchObject({ x: 60, y: 40, color: "black" });
  });
});
