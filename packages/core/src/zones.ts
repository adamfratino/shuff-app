import {
  APEX,
  DISC_RADIUS,
  HALF_COURT_LENGTH,
  HALF_COURT_WIDTH,
  KITCHEN_DEPTH,
  LAG_LINE_Y,
} from "./constants";
import type { Disc } from "./types";

/**
 * Painted line width per ILSA, in inches.
 */
export const LINE_WIDTH = 1;

const LINE_HALF_WIDTH = LINE_WIDTH / 2;

/**
 * Minimum clearance from any scoring line a disc center must maintain to
 * count as "fully within" a zone per ILSA 1.3.1. Disc radius (3) plus the
 * 0.5" half-width of a painted line = 3.5".
 */
export const SCORING_CLEARANCE = DISC_RADIUS + LINE_HALF_WIDTH;

/**
 * Every zone a point can occupy on the half-court.
 */
export type Zone =
  | "kitchen"
  | "7-left"
  | "7-right"
  | "8-left"
  | "8-right"
  | "10"
  | "buffer"
  | "dead-zone"
  | "off-court";

/**
 * Zones in which a disc can score points.
 */
export type ScoringZone =
  | "kitchen"
  | "7-left"
  | "7-right"
  | "8-left"
  | "8-right"
  | "10";

const SCORE_VALUES: Record<ScoringZone, number> = {
  kitchen: -10,
  "7-left": 7,
  "7-right": 7,
  "8-left": 8,
  "8-right": 8,
  "10": 10,
};

export function isScoringZone(zone: Zone): zone is ScoringZone {
  return zone in SCORE_VALUES;
}

export function scoreValue(zone: ScoringZone): number {
  return SCORE_VALUES[zone];
}

/**
 * Geometric zone containing the point `(x, y)`. Treats the point as
 * dimensionless — ignores disc radius. Use `scoringZone(disc)` to ask
 * whether a disc legally scores.
 *
 * Boundary convention: a point exactly on a transverse line (y = 18, 54, 90)
 * is assigned to the higher-y (forward) zone. A point exactly on the
 * centerline (x = 36) is assigned to the right half.
 */
export function zoneAt(x: number, y: number): Zone {
  if (y < 0 || y > HALF_COURT_LENGTH) return "off-court";
  if (y > LAG_LINE_Y) return "dead-zone";
  if (y > APEX.y) {
    if (x < 0 || x > HALF_COURT_WIDTH) return "off-court";
    return "buffer";
  }
  if (y < KITCHEN_DEPTH) {
    const kitchenLeft = y / 3;
    const kitchenRight = HALF_COURT_WIDTH - y / 3;
    if (x < kitchenLeft || x > kitchenRight) return "off-court";
    return "kitchen";
  }
  const triLeft = (y - KITCHEN_DEPTH) / 3;
  const triRight = HALF_COURT_WIDTH - (y - KITCHEN_DEPTH) / 3;
  if (x < triLeft || x > triRight) return "off-court";
  if (y < 54) return x < APEX.x ? "7-left" : "7-right";
  if (y < 90) return x < APEX.x ? "8-left" : "8-right";
  return "10";
}

/**
 * Returns the scoring zone the disc is fully inside, with ≥
 * `SCORING_CLEARANCE` (3.5") from every painted scoring line. Returns
 * `null` if the disc touches a line, straddles the centerline, or lies
 * outside any scoring zone.
 *
 * The kitchen separator triangle is decorative (rule 1.3.1.4) and is
 * NOT treated as a scoring line — a disc touching it still scores -10.
 */
export function scoringZone(disc: Disc): ScoringZone | null {
  const { x, y } = disc;
  if (isFullyInKitchen(x, y)) return "kitchen";
  if (isFullyInSevenLeft(x, y)) return "7-left";
  if (isFullyInSevenRight(x, y)) return "7-right";
  if (isFullyInEightLeft(x, y)) return "8-left";
  if (isFullyInEightRight(x, y)) return "8-right";
  if (isFullyInTen(x, y)) return "10";
  return null;
}

/**
 * Points awarded for a disc's final resting position. 0 if the disc is
 * not fully within any scoring zone.
 */
export function score(disc: Disc): number {
  const z = scoringZone(disc);
  return z === null ? 0 : SCORE_VALUES[z];
}

/**
 * Simplified liveness check: disc center is on the playing surface and
 * the disc has touched or passed the lag line. Replay-time dead-disc
 * semantics (rebounds, etc.) are deferred — see `docs/RULES.md`.
 */
export function isAlive(disc: Disc): boolean {
  return (
    disc.x >= 0 &&
    disc.x <= HALF_COURT_WIDTH &&
    disc.y >= 0 &&
    disc.y <= LAG_LINE_Y + DISC_RADIUS + LINE_HALF_WIDTH
  );
}

/**
 * Counts fully-scoring discs by zone. Keys are the active zones; values are
 * the disc count. Useful for highlighting (e.g., scaling fill opacity by
 * count) and for tallying disc distribution.
 */
export function activeScoringZones(
  discs: readonly Disc[],
): Map<ScoringZone, number> {
  const counts = new Map<ScoringZone, number>();
  for (const disc of discs) {
    const z = scoringZone(disc);
    if (z !== null) counts.set(z, (counts.get(z) ?? 0) + 1);
  }
  return counts;
}

/**
 * Per-color total for a single frame. Sums `score(disc)` across all discs,
 * grouped by their `color` string. ILSA scoring does not cancel between
 * sides — both colors can score in the same frame.
 *
 * Color-agnostic: keys are whatever strings appear in `disc.color`. The
 * returned map only includes colors with at least one disc; a color with
 * all non-scoring discs is included with a value of `0`.
 *
 * Discs in the kitchen contribute `-10` to their color's total per ILSA
 * 1.3.1; discs outside any scoring zone contribute `0`.
 */
export function frameScore(discs: readonly Disc[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const disc of discs) {
    totals.set(disc.color, (totals.get(disc.color) ?? 0) + score(disc));
  }
  return totals;
}

// ----- internal clearance checks -------------------------------------------
// Triangle edges:
//   Left edge from (0, 18) → (36, 126): 3x − y + 18 = 0. Inside: 3x − y + 18 > 0.
//   Right edge from (72, 18) → (36, 126): 3x + y − 234 = 0. Inside: 234 − 3x − y > 0.
// Kitchen edges:
//   Left diagonal from (0, 0) → (6, 18): 3x − y = 0. Inside: 3x − y > 0.
//   Right diagonal from (72, 0) → (66, 18): 3x + y − 216 = 0. Inside: 216 − 3x − y > 0.
// All have denominator sqrt(10).

const SQRT_10 = Math.sqrt(10);

function clearFromTriLeft(x: number, y: number): number {
  return (3 * x - y + 18) / SQRT_10;
}

function clearFromTriRight(x: number, y: number): number {
  return (234 - 3 * x - y) / SQRT_10;
}

function clearFromKitchenLeft(x: number, y: number): number {
  return (3 * x - y) / SQRT_10;
}

function clearFromKitchenRight(x: number, y: number): number {
  return (216 - 3 * x - y) / SQRT_10;
}

function isFullyInKitchen(x: number, y: number): boolean {
  if (y - SCORING_CLEARANCE < 0) return false;
  if (y + SCORING_CLEARANCE > KITCHEN_DEPTH) return false;
  if (clearFromKitchenLeft(x, y) < SCORING_CLEARANCE) return false;
  if (clearFromKitchenRight(x, y) < SCORING_CLEARANCE) return false;
  return true;
}

function isFullyInSevenLeft(x: number, y: number): boolean {
  if (y - SCORING_CLEARANCE < KITCHEN_DEPTH) return false;
  if (y + SCORING_CLEARANCE > 54) return false;
  if (x + SCORING_CLEARANCE > APEX.x) return false;
  if (clearFromTriLeft(x, y) < SCORING_CLEARANCE) return false;
  return true;
}

function isFullyInSevenRight(x: number, y: number): boolean {
  if (y - SCORING_CLEARANCE < KITCHEN_DEPTH) return false;
  if (y + SCORING_CLEARANCE > 54) return false;
  if (x - SCORING_CLEARANCE < APEX.x) return false;
  if (clearFromTriRight(x, y) < SCORING_CLEARANCE) return false;
  return true;
}

function isFullyInEightLeft(x: number, y: number): boolean {
  if (y - SCORING_CLEARANCE < 54) return false;
  if (y + SCORING_CLEARANCE > 90) return false;
  if (x + SCORING_CLEARANCE > APEX.x) return false;
  if (clearFromTriLeft(x, y) < SCORING_CLEARANCE) return false;
  return true;
}

function isFullyInEightRight(x: number, y: number): boolean {
  if (y - SCORING_CLEARANCE < 54) return false;
  if (y + SCORING_CLEARANCE > 90) return false;
  if (x - SCORING_CLEARANCE < APEX.x) return false;
  if (clearFromTriRight(x, y) < SCORING_CLEARANCE) return false;
  return true;
}

function isFullyInTen(x: number, y: number): boolean {
  if (y - SCORING_CLEARANCE < 90) return false;
  if (y > APEX.y) return false;
  if (clearFromTriLeft(x, y) < SCORING_CLEARANCE) return false;
  if (clearFromTriRight(x, y) < SCORING_CLEARANCE) return false;
  return true;
}
