/**
 * Monte Carlo shot evaluation (docs/STRATEGY.md § Decision Principles):
 * each candidate is simulated under execution noise and scored as
 *
 *   V(shot) = Δ(my score − their score)
 *           − w_kitchen · max over my scorers of P(kitchened) · (s + 10)
 *           − w_clear   · max over my scorers of P(cleared)   · s
 *           + protection bonus for de-exposing pre-existing scorers
 *
 * with situational modulation: risk terms vanish on the hammer, the
 * match-score gap scales risk appetite in the last frame, and the final
 * shot of a losing match is scored by P(win), not expected points.
 */

import { type Disc, score } from "@shuff/core";
import { allCandidates } from "./candidates";
import { resolveOptions, SHOTS_PER_FRAME } from "./constants";
import { clearExposure, kitchenExposure } from "./exposure";
import { simulateShot } from "@shuff/motion";
import type {
  EvaluatedShot,
  ResolvedStrategyOptions,
  ShotCandidate,
  StrategyOptions,
} from "./types";

/** Box-Muller Gaussian with mean 0 and the given standard deviation. */
function gauss(sigma: number, rng: () => number): number {
  const u1 = Math.max(1e-10, rng());
  const u2 = rng();
  return sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Signed board value from my perspective: my points minus theirs. */
function boardValue(board: readonly Disc[], color: string): number {
  let total = 0;
  for (const d of board) {
    const s = score(d);
    total += d.color === color ? s : -s;
  }
  return total;
}

const SHOOTER_ID = "@shuff/strategy:shooter";

/** Board clone with synthetic ids so trial results can be matched back. */
function withIds(board: readonly Disc[]): Disc[] {
  return board.map((d, i) => ({ ...d, id: d.id ?? `@shuff/strategy:${i}` }));
}

function riskWeights(
  options: ResolvedStrategyOptions,
): { kitchen: number; clear: number } {
  // The hammer has no reply — exposure is meaningless on the frame's
  // last shot.
  if (options.shotNumber >= SHOTS_PER_FRAME) return { kitchen: 0, clear: 0 };

  let kitchen = options.kitchenWeight;
  // Last frame, past the opening shots: protect a lead, chase a deficit.
  if (options.lastFrame && options.shotNumber >= 3) {
    const gap = options.scoreGap;
    if (gap > 5) kitchen *= 2.0;
    else if (gap > 0) kitchen *= 1.5;
    else if (gap > -5) kitchen *= 0.6;
    else kitchen *= 0.3;
  }
  return { kitchen, clear: options.clearWeight };
}

/**
 * Mean per-trial value of `candidate` on `board`, over
 * `options.trials` noisy simulations.
 */
export function evaluateShot(
  board: readonly Disc[],
  candidate: ShotCandidate,
  options: StrategyOptions,
): number {
  const resolved = resolveOptions(options);
  const { rng, color, opponentStarts } = resolved;
  const tracked = withIds(board);
  const weights = riskWeights(resolved);

  const scoreBefore = boardValue(tracked, color);

  // Pre-existing scorers of mine, with their exposure before the shot —
  // the baseline for the protection bonus.
  const protectees = tracked
    .filter((d) => d.color === color && score(d) > 0)
    .map((d) => ({
      id: d.id as string,
      value: score(d),
      exposure: kitchenExposure(d, tracked, opponentStarts),
    }));

  // Win-probability mode: hammer of the last frame while losing — a trial
  // only counts if it reaches the swing needed to tie or win.
  const neededSwing = -resolved.scoreGap - scoreBefore;
  const winProbMode =
    resolved.shotNumber >= SHOTS_PER_FRAME &&
    resolved.lastFrame &&
    neededSwing > 0;

  let total = 0;
  for (let trial = 0; trial < resolved.trials; trial++) {
    const speed =
      candidate.speed * Math.max(0, 1 + gauss(resolved.speedNoise, rng));
    const angle = (gauss(resolved.angleNoise, rng) * Math.PI) / 180;
    const dx = candidate.aim.x - candidate.start.x;
    const dy = candidate.aim.y - candidate.start.y;
    const aim = {
      x: candidate.start.x + dx * Math.cos(angle) - dy * Math.sin(angle),
      y: candidate.start.y + dx * Math.sin(angle) + dy * Math.cos(angle),
    };

    const result = simulateShot(
      tracked,
      { start: candidate.start, aim, speed },
      { color, id: SHOOTER_ID },
      resolved.courtSpeed,
    );

    const V = boardValue(result.board, color) - scoreBefore;

    if (winProbMode) {
      total += V >= neededSwing ? 10 : Math.max(0, V / neededSwing);
      continue;
    }

    // Worst-case exposure among my scorers after the shot.
    let kitchenPenalty = 0;
    let clearPenalty = 0;
    for (const d of result.board) {
      if (d.color !== color) continue;
      const s = score(d);
      if (s <= 0) continue;
      const pKitchen = kitchenExposure(d, result.board, opponentStarts);
      if (pKitchen > 0) {
        kitchenPenalty = Math.max(kitchenPenalty, pKitchen * (s + 10));
      }
      const pClear = clearExposure(d, result.board, opponentStarts);
      if (pClear > 0) {
        clearPenalty = Math.max(clearPenalty, pClear * s);
      }
    }

    // Reward shots that reduce exposure of scorers I already had — this is
    // what makes a pure guard (which scores nothing) outrank a placement.
    let protection = 0;
    for (const p of protectees) {
      const after = result.board.find((d) => d.id === p.id);
      if (!after) continue;
      const exposureAfter = kitchenExposure(after, result.board, opponentStarts);
      if (exposureAfter < p.exposure) {
        protection +=
          (p.exposure - exposureAfter) * (p.value + 10) * weights.kitchen;
      }
    }

    total +=
      V -
      weights.kitchen * kitchenPenalty -
      weights.clear * clearPenalty +
      protection;
  }
  return total / resolved.trials;
}

/**
 * Every candidate the board admits, evaluated and sorted best-first.
 * The ranking (not just the winner) is useful on its own — e.g. docs
 * examples showing the top handful of replies to a position.
 */
export function rankShots(
  board: readonly Disc[],
  options: StrategyOptions,
): EvaluatedShot[] {
  return allCandidates(board, options)
    .map((candidate) => ({
      candidate,
      value: evaluateShot(board, candidate, options),
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * The best shot for this board and situation, or `null` only if no
 * candidate exists (an empty candidate set does not occur in practice —
 * placement candidates always exist).
 */
export function chooseShot(
  board: readonly Disc[],
  options: StrategyOptions,
): EvaluatedShot | null {
  const ranked = rankShots(board, options);
  return ranked[0] ?? null;
}
