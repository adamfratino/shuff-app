import type { Point } from "@shuff/core";
import { DEFAULT_MU } from "@shuff/motion";
import type { ResolvedStrategyOptions, StrategyOptions } from "./types";

/**
 * Where a shot is released from: mid-kitchen at the shooting end, expressed
 * in the target end's half-court coordinates (off-canvas, past the rendered
 * end). Matches the shuffleboardjam.com reference model.
 */
export const SHOOTING_Y = 230;

/**
 * Kitchen shooting slots — three per side of the separator triangle
 * (left / middle / right of the shooter's half), at `SHOOTING_Y`.
 */
export const LEFT_STARTS: readonly Point[] = [
  { x: 12, y: SHOOTING_Y },
  { x: 21, y: SHOOTING_Y },
  { x: 30, y: SHOOTING_Y },
];
export const RIGHT_STARTS: readonly Point[] = [
  { x: 42, y: SHOOTING_Y },
  { x: 51, y: SHOOTING_Y },
  { x: 60, y: SHOOTING_Y },
];

/**
 * Speed multiplier for "hard" shots (`hard-clear`, `hard-sweep`,
 * `kitchen-clear`): 1.5× the exact-stop speed to the aim point, i.e. a
 * 2.25× overshoot budget — certainty of removal over placement.
 */
export const HARD_FACTOR = 1.5;

/** Evaluation weight on kitchen exposure of my scorers. */
export const KITCHEN_WEIGHT = 0.6;

/**
 * Evaluation weight on direct-clear exposure. Deliberately far below
 * `KITCHEN_WEIGHT`: a cleared scorer costs `s`, a kitchened one swings
 * `s + 10`.
 */
export const CLEAR_WEIGHT = 0.15;

/**
 * Exposure model: P(success) of one clean opponent line. Kitchen attempts
 * must thread a struck disc into a specific zone; direct clears only need
 * contact, so their base is higher.
 */
export const P_KITCHEN_BASE = 0.65;
export const P_CLEAR_BASE = 0.7;

/**
 * Exposure bonus per additional unblocked line (the opponent picks their
 * best angle; extra options help but don't compound), and the cap on any
 * single exposure estimate.
 */
export const P_MULTI_LINE_BONUS = 0.08;
export const P_MAX = 0.9;

/** Monte Carlo trials per candidate. */
export const DEFAULT_TRIALS = 30;

/**
 * Execution-noise defaults, calibrated to the shuffleboardjam.com
 * "advanced" CPU: ~1.2% speed error, ~0.35° aim error.
 */
export const DEFAULT_SPEED_NOISE = 0.012;
export const DEFAULT_ANGLE_NOISE = 0.35;

/** Shots per frame (8 alternating shots; the 8th is the hammer). */
export const SHOTS_PER_FRAME = 8;

/** Applies documented defaults to caller-supplied options. */
export function resolveOptions(
  options: StrategyOptions,
): ResolvedStrategyOptions {
  return {
    color: options.color,
    courtSpeed: options.courtSpeed ?? DEFAULT_MU,
    starts: options.starts ?? RIGHT_STARTS,
    opponentStarts: options.opponentStarts ?? LEFT_STARTS,
    shotNumber: options.shotNumber ?? 4,
    scoreGap: options.scoreGap ?? 0,
    lastFrame: options.lastFrame ?? false,
    trials: options.trials ?? DEFAULT_TRIALS,
    speedNoise: options.speedNoise ?? DEFAULT_SPEED_NOISE,
    angleNoise: options.angleNoise ?? DEFAULT_ANGLE_NOISE,
    kitchenWeight: options.kitchenWeight ?? KITCHEN_WEIGHT,
    clearWeight: options.clearWeight ?? CLEAR_WEIGHT,
    rng: options.rng ?? Math.random,
  };
}
