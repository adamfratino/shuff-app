import {
  APEX,
  DISC_RADIUS,
  FULL_COURT_LENGTH,
  HALF_COURT_WIDTH,
} from "./constants";
import type { Disc, Point } from "./types";

/**
 * Euclidean distance between two points, in inches.
 */
export function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * The disc whose center is nearest the apex of the 10 (36, 126). Returns
 * `null` for an empty list. Ties are broken by input order (first wins).
 */
export function closestToApex(discs: readonly Disc[]): Disc | null {
  let best: Disc | null = null;
  let bestDistance = Infinity;
  for (const d of discs) {
    const dist = distance(d, APEX);
    if (dist < bestDistance) {
      bestDistance = dist;
      best = d;
    }
  }
  return best;
}

/**
 * True iff two discs are in contact — center-to-center distance ≤ disc
 * diameter (`2 * DISC_RADIUS`). Real-world discs cannot overlap, so this
 * also serves as a proxy for "stacked" / "mounted" when paired with z-order.
 */
export function discsTouching(a: Disc, b: Disc): boolean {
  return distance(a, b) <= 2 * DISC_RADIUS;
}

/**
 * Reflects a point or disc across the full-court centerline (`y =
 * HALF_COURT_LENGTH`), converting between the two ends. A point at the
 * target-end back baseline (y = 0) maps to the far-end back baseline (y =
 * 468) and vice versa.
 *
 * Preserves the input's extra fields (e.g., `color` on a Disc) and return
 * type — pass a Disc, get a Disc; pass a Point, get a Point.
 */
export function mirrorEnd<T extends Point>(p: T): T {
  return { ...p, y: FULL_COURT_LENGTH - p.y };
}

/**
 * Reflects a point or disc across the longitudinal centerline (`x =
 * HALF_COURT_WIDTH / 2`, i.e. 36"). Useful for mirroring a frame's layout
 * left-to-right (e.g., visualizing how a play would look from the other
 * side of the court).
 *
 * Preserves the input's extra fields (e.g., `color` on a Disc) and return
 * type — pass a Disc, get a Disc; pass a Point, get a Point.
 */
export function mirrorSide<T extends Point>(p: T): T {
  return { ...p, x: HALF_COURT_WIDTH - p.x };
}
