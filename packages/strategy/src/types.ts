import type { Disc, Point } from "@shuff/core";
import type { Shot } from "@shuff/motion";

// Shot kinematics and simulation outcomes live in @shuff/motion (the Jam
// model's package); re-exported here because every candidate is a Shot.
export type { Shot, ShotResult } from "@shuff/motion";

/**
 * The named shots of floor shuffleboard. See docs/STRATEGY.md for the full
 * taxonomy — each token is a tactic a player would recognize by name.
 *
 * Intent is annotation, not physics: it records what a shot is *for*, and
 * the same disc velocities could serve two intents.
 */
export type ShotIntent =
  | "score"
  | "kitchen"
  | "clear"
  | "hard-clear"
  | "bump"
  | "block"
  | "snuggle"
  | "kitchen-replace"
  | "kitchen-clear"
  | "sweep"
  | "hard-sweep"
  | "ten-block";

/**
 * A shot candidate produced by a generator, tagged with the tactic it
 * implements.
 */
export type ShotCandidate = Shot & {
  intent: ShotIntent;
};

/**
 * Everything the strategy engine needs to know beyond the discs on the
 * board. Only `color` is required — every knob has a documented default.
 */
export type StrategyOptions = {
  /**
   * The shooter's disc color. Discs on the board with this exact `color`
   * string are "mine"; every other disc is the opponent's.
   */
  color: string;

  /**
   * Court friction μ in inches/second² — the same court-speed knob as
   * `@shuff/motion`. Lower is a faster (beaded) court. Default `DEFAULT_MU`.
   */
  courtSpeed?: number;

  /**
   * Kitchen slots the shooter may shoot from, in half-court coordinates
   * (y = `SHOOTING_Y`, off-canvas past the rendered target end). Default
   * `RIGHT_STARTS` (ILSA yellow-at-head convention).
   */
  starts?: readonly Point[];

  /**
   * Kitchen slots the *opponent* shoots from — exposure is computed along
   * their lines of sight. Default `LEFT_STARTS`.
   */
  opponentStarts?: readonly Point[];

  /**
   * Which shot of the frame this is, 1–8. Shot 8 is the hammer (no reply —
   * risk terms vanish); shot 7 unlocks `ten-block`. Default 4 (mid-frame).
   */
  shotNumber?: number;

  /**
   * Match-score gap going into this frame: my total minus theirs. Modulates
   * risk appetite in the last frame (protect a lead, chase a deficit).
   * Default 0.
   */
  scoreGap?: number;

  /**
   * True when this frame is the last of the match. Enables score-gap risk
   * modulation and, on the hammer while losing, win-probability mode.
   * Default false.
   */
  lastFrame?: boolean;

  /** Monte Carlo trials per candidate. Default `DEFAULT_TRIALS`. */
  trials?: number;

  /**
   * Execution noise: standard deviation of launch-speed error as a fraction
   * of the intended speed. Default `DEFAULT_SPEED_NOISE` (≈ a strong
   * player). Raise it for a weaker shooter.
   */
  speedNoise?: number;

  /**
   * Execution noise: standard deviation of aim-angle error, in degrees.
   * Default `DEFAULT_ANGLE_NOISE`.
   */
  angleNoise?: number;

  /**
   * Weight on kitchen exposure (risk of my scorers being kitchened) in the
   * evaluation. Default `KITCHEN_WEIGHT`.
   */
  kitchenWeight?: number;

  /**
   * Weight on direct-clear exposure (risk of my scorers being knocked off).
   * Default `CLEAR_WEIGHT`.
   */
  clearWeight?: number;

  /**
   * Random source for Monte Carlo noise, returning uniform [0, 1). Inject a
   * seeded generator for reproducible evaluation. Default `Math.random`.
   */
  rng?: () => number;
};

/** `StrategyOptions` with every default applied. */
export type ResolvedStrategyOptions = Required<StrategyOptions>;

/** A candidate with its Monte Carlo evaluation. */
export type EvaluatedShot = {
  candidate: ShotCandidate;
  /** Mean per-trial value: score swing minus weighted exposure penalties. */
  value: number;
};
