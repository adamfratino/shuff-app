import type { Disc } from "@shuff/core";
import { describe, expect, it } from "vitest";
import { exactSpeed } from "./aim";
import { blockCandidates, kitchenCandidates } from "./candidates";
import { resolveOptions } from "./constants";
import { chooseShot, evaluateShot } from "./evaluate";
import type { ShotCandidate, StrategyOptions } from "./types";

/** Seeded PRNG (mulberry32): deterministic but well-distributed noise. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function opts(overrides: Partial<StrategyOptions> = {}): StrategyOptions {
  return { color: "yellow", trials: 10, rng: mulberry32(42), ...overrides };
}

function disc(x: number, y: number, color: string, id: string): Disc {
  return { x, y, color, id };
}

describe("evaluateShot", () => {
  it("values kitchening an opponent scorer above its face value", () => {
    const opp = disc(30, 72, "black", "o1"); // a naked 8, kitchen lines open
    const board = [opp];
    const candidates = kitchenCandidates(board, resolveOptions(opts()));
    expect(candidates.length).toBeGreaterThan(0);
    const best = Math.max(
      ...candidates.map((c) => evaluateShot(board, c, opts())),
    );
    // Their 8 → their −10 is an 18-point swing; even discounting misses
    // this should comfortably beat a plain placement's ~8.
    expect(best).toBeGreaterThan(10);
  });

  it("prefers guarding an exposed scorer mid-frame, but not on the hammer", () => {
    const mine = disc(30, 72, "yellow", "m1"); // my naked 8
    const board = [mine];
    const midFrame = opts({ shotNumber: 4 });

    const guard = blockCandidates(board, resolveOptions(midFrame)).find(
      (c) => c.aim.x > 28 && c.aim.x < 32,
    );
    expect(guard).toBeDefined();
    const start = { x: 51, y: 230 };
    // A second exposed scorer, dead-center in the 10 (the 10 zone has no
    // centerline split, so x = 36 scores).
    const aim = { x: 36, y: 104 };
    const nakedPlacement: ShotCandidate = {
      start,
      aim,
      speed: exactSpeed(start, aim),
      intent: "score",
    };

    // Mid-frame: converting an 18-point liability into a safe 8 beats
    // adding a second liability.
    expect(evaluateShot(board, guard!, midFrame)).toBeGreaterThan(
      evaluateShot(board, nakedPlacement, midFrame),
    );

    // On the hammer there is no reply: exposure is meaningless, points win.
    const hammer = opts({ shotNumber: 8 });
    expect(evaluateShot(board, nakedPlacement, hammer)).toBeGreaterThan(
      evaluateShot(board, guard!, hammer),
    );
  });
});

describe("chooseShot", () => {
  it("attacks a naked opponent scorer rather than placing alongside it", () => {
    const opp = disc(30, 72, "black", "o1");
    const best = chooseShot([opp], opts({ trials: 5 }));
    expect(best).not.toBeNull();
    expect(["kitchen", "clear", "hard-clear"]).toContain(
      best!.candidate.intent,
    );
  });

  it("scores with the hammer on an empty board", () => {
    // Last shot of the frame, nothing on the board: no reply is coming,
    // so pure placement wins — and the 10 zone is where it lands.
    const best = chooseShot([], opts({ trials: 5, shotNumber: 8 }));
    expect(best).not.toBeNull();
    expect(best!.candidate.intent).toBe("score");
    expect(best!.value).toBeGreaterThan(5);
  });
});
