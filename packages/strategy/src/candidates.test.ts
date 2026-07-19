import type { Disc } from "@shuff/core";
import { describe, expect, it } from "vitest";
import {
  allCandidates,
  bumpCandidates,
  kitchenClearCandidates,
  kitchenReplaceCandidates,
  scoreCandidates,
  sweepCandidates,
  tenBlockCandidates,
} from "./candidates";
import { LEFT_STARTS, resolveOptions, RIGHT_STARTS } from "./constants";

const OPTS = resolveOptions({ color: "yellow" });

function disc(x: number, y: number, color: string, id: string): Disc {
  return { x, y, color, id };
}

describe("scoreCandidates", () => {
  it("only aims at positive scoring zones, from every slot", () => {
    const candidates = scoreCandidates(OPTS);
    expect(candidates.length).toBeGreaterThan(0);
    for (const c of candidates) {
      expect(c.intent).toBe("score");
      expect(c.aim.y).toBeGreaterThan(18); // never into the kitchen
      expect(c.aim.y).toBeLessThanOrEqual(126);
    }
    const starts = new Set(candidates.map((c) => c.start.x));
    expect(starts.size).toBe(RIGHT_STARTS.length);
  });
});

describe("gating", () => {
  it("kitchen-replace needs my disc at −10 and a swappable opponent", () => {
    const mineIn = disc(36, 9, "yellow", "k1");
    const oppScorer = disc(36, 72, "black", "o1");
    expect(kitchenReplaceCandidates([oppScorer], OPTS)).toHaveLength(0);
    expect(
      kitchenReplaceCandidates([mineIn, oppScorer], OPTS).length,
    ).toBeGreaterThan(0);
  });

  it("kitchen-clear needs my disc at −10", () => {
    expect(kitchenClearCandidates([disc(36, 72, "yellow", "s")], OPTS))
      .toHaveLength(0);
    expect(
      kitchenClearCandidates([disc(36, 9, "yellow", "k")], OPTS).length,
    ).toBeGreaterThan(0);
  });

  it("sweep needs two opponent scorers sharing a zone", () => {
    const one = disc(30, 72, "black", "o1");
    const twoApart = disc(45, 40, "black", "o2"); // different zone (7-right)
    const twoTogether = disc(30, 80, "black", "o3"); // same 8-left zone
    expect(sweepCandidates([one, twoApart], OPTS)).toHaveLength(0);
    expect(sweepCandidates([one, twoTogether], OPTS).length).toBeGreaterThan(0);
  });

  it("bump targets my non-scoring disc on a line", () => {
    const onLine = disc(36, 40, "yellow", "line"); // straddling centerline: scores 0
    const clean = disc(27, 72, "yellow", "clean");
    expect(bumpCandidates([clean], OPTS)).toHaveLength(0);
    const candidates = bumpCandidates([onLine], OPTS);
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0]!.intent).toBe("bump");
  });

  it("ten-block only appears on shot 7", () => {
    const board = [disc(30, 72, "black", "o1")];
    const shot6 = allCandidates(board, { color: "yellow", shotNumber: 6 });
    const shot7 = allCandidates(board, { color: "yellow", shotNumber: 7 });
    expect(shot6.some((c) => c.intent === "ten-block")).toBe(false);
    expect(shot7.some((c) => c.intent === "ten-block")).toBe(true);
  });
});

describe("tenBlockCandidates", () => {
  it("parks in the opponent's lane to the 10, short of it", () => {
    const candidates = tenBlockCandidates({
      starts: RIGHT_STARTS,
      opponentStarts: LEFT_STARTS,
      courtSpeed: 160,
    });
    for (const c of candidates) {
      expect(c.aim.y).toBe(140); // in the approach lane, past the apex
    }
  });
});
