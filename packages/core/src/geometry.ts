import { DISC_DIAMETER, DISC_RADIUS } from "./constants";
import { distance } from "./spatial";
import type { Disc, Point } from "./types";

/**
 * Default extension length for shadow rays past the tangent points.
 * Larger than any half-court dimension so SVG viewBoxes naturally clip.
 */
const SHADOW_FAR_DISTANCE = 1000;

function angle(from: Point, to: Point): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

/**
 * Angular half-width (radians) of a disc with the given radius as seen from
 * the viewpoint. The full angular subtense is `2 * angularHalfWidth(...)`.
 * Returns `Math.PI` (everything) if the viewpoint is inside the disc.
 */
function angularHalfWidth(
  viewpoint: Point,
  disc: Point,
  radius: number,
): number {
  const d = distance(viewpoint, disc);
  if (d <= radius) return Math.PI;
  return Math.asin(radius / d);
}

/** Normalize an angle to [-π, π]. */
function normalizeAngle(theta: number): number {
  let t = theta;
  while (t > Math.PI) t -= 2 * Math.PI;
  while (t < -Math.PI) t += 2 * Math.PI;
  return t;
}

/**
 * Returns the subset of `blockers` whose disc area lies between the shooter
 * and the target along the line-of-sight — i.e., from the shooter's view,
 * each returned blocker covers some portion of the target's apparent area.
 *
 * A disc B blocks target T if:
 *   1. B is strictly closer to the shooter than T (center-to-center).
 *   2. B's angular range from the shooter overlaps T's angular range.
 *
 * Discs at equal distance to the shooter never count as blockers — they're
 * side-by-side, not in front.
 */
export function findBlockers(
  shooter: Point,
  target: Disc,
  blockers: readonly Disc[],
): Disc[] {
  const targetDistance = distance(shooter, target);
  if (targetDistance <= DISC_RADIUS) return [];

  const targetAngle = angle(shooter, target);
  const targetHalfWidth = angularHalfWidth(shooter, target, DISC_RADIUS);

  const result: Disc[] = [];
  for (const b of blockers) {
    const bDistance = distance(shooter, b);
    if (bDistance >= targetDistance) continue;
    const bAngle = angle(shooter, b);
    const bHalfWidth = angularHalfWidth(shooter, b, DISC_RADIUS);
    if (
      Math.abs(normalizeAngle(bAngle - targetAngle)) <
      bHalfWidth + targetHalfWidth
    ) {
      result.push(b);
    }
  }
  return result;
}

/**
 * True if at least one disc in `blockers` occludes the target from the
 * shooter's viewpoint. Equivalent to `findBlockers(...).length > 0` but
 * short-circuits on first hit.
 */
export function isOccluded(
  shooter: Point,
  target: Disc,
  blockers: readonly Disc[],
): boolean {
  const targetDistance = distance(shooter, target);
  if (targetDistance <= DISC_RADIUS) return false;
  const targetAngle = angle(shooter, target);
  const targetHalfWidth = angularHalfWidth(shooter, target, DISC_RADIUS);

  for (const b of blockers) {
    const bDistance = distance(shooter, b);
    if (bDistance >= targetDistance) continue;
    const bAngle = angle(shooter, b);
    const bHalfWidth = angularHalfWidth(shooter, b, DISC_RADIUS);
    if (
      Math.abs(normalizeAngle(bAngle - targetAngle)) <
      bHalfWidth + targetHalfWidth
    ) {
      return true;
    }
  }
  return false;
}

/**
 * How much of the target's apparent silhouette is covered by blockers, from
 * the shooter's viewpoint.
 *
 *   - `fraction`: occluded share of the target's angular subtense, in [0, 1].
 *   - `inches`: approximate projected width hidden, `fraction * DISC_DIAMETER`.
 *     For shooter distances >> disc radius (the shuffleboard case) this is
 *     a close match to the silhouette width that's blocked.
 *   - `blockers`: the subset of `others` that contribute to the occlusion.
 *
 * Multiple blockers are combined by union of their angular intervals so
 * overlapping shadows don't double-count.
 */
export type OcclusionResult = {
  fraction: number;
  inches: number;
  blockers: Disc[];
};

export function occlusion(
  shooter: Point,
  target: Disc,
  others: readonly Disc[],
): OcclusionResult {
  const targetDistance = distance(shooter, target);
  if (targetDistance <= DISC_RADIUS) {
    return { fraction: 1, inches: DISC_DIAMETER, blockers: [] };
  }

  const targetAngle = angle(shooter, target);
  const targetHalfWidth = angularHalfWidth(shooter, target, DISC_RADIUS);
  const targetStart = -targetHalfWidth;
  const targetEnd = targetHalfWidth;

  const intervals: Array<[number, number]> = [];
  const blockingDiscs: Disc[] = [];

  for (const b of others) {
    const bDistance = distance(shooter, b);
    if (bDistance >= targetDistance) continue;
    const bAngle = angle(shooter, b);
    const bHalfWidth = angularHalfWidth(shooter, b, DISC_RADIUS);
    // Express b's angular range relative to target's center angle.
    const relAngle = normalizeAngle(bAngle - targetAngle);
    const start = Math.max(relAngle - bHalfWidth, targetStart);
    const end = Math.min(relAngle + bHalfWidth, targetEnd);
    if (start < end) {
      intervals.push([start, end]);
      blockingDiscs.push(b);
    }
  }

  if (intervals.length === 0) {
    return { fraction: 0, inches: 0, blockers: [] };
  }

  intervals.sort((a, b) => a[0] - b[0]);
  let total = 0;
  let [curStart, curEnd] = intervals[0]!;
  for (let i = 1; i < intervals.length; i++) {
    const [s, e] = intervals[i]!;
    if (s <= curEnd) {
      curEnd = Math.max(curEnd, e);
    } else {
      total += curEnd - curStart;
      curStart = s;
      curEnd = e;
    }
  }
  total += curEnd - curStart;

  const fraction = Math.min(1, total / (2 * targetHalfWidth));
  return {
    fraction,
    inches: fraction * DISC_DIAMETER,
    blockers: blockingDiscs,
  };
}

/**
 * Computes the two tangent points where lines from `viewpoint` graze a
 * circle at `center` with `radius`. Returns `null` if the viewpoint is on
 * or inside the circle.
 *
 * The two tangent points are symmetric about the line from viewpoint to
 * center; element `[0]` is the clockwise tangent (from viewpoint's
 * perspective), `[1]` is counter-clockwise.
 */
export function tangentPoints(
  viewpoint: Point,
  center: Point,
  radius: number,
): [Point, Point] | null {
  const dx = center.x - viewpoint.x;
  const dy = center.y - viewpoint.y;
  const d2 = dx * dx + dy * dy;
  if (d2 <= radius * radius) return null;
  const d = Math.sqrt(d2);
  const tangentDist = Math.sqrt(d2 - radius * radius);
  const baseAngle = Math.atan2(dy, dx);
  const halfAngle = Math.asin(radius / d);
  const a1 = baseAngle - halfAngle;
  const a2 = baseAngle + halfAngle;
  return [
    {
      x: viewpoint.x + tangentDist * Math.cos(a1),
      y: viewpoint.y + tangentDist * Math.sin(a1),
    },
    {
      x: viewpoint.x + tangentDist * Math.cos(a2),
      y: viewpoint.y + tangentDist * Math.sin(a2),
    },
  ];
}

/**
 * Four-vertex polygon enclosing the shadow a circular blocker casts when
 * lit from `viewpoint`. Vertices are ordered:
 *
 *   [t1, far1, far2, t2]
 *
 * where `t1` / `t2` are the tangent points (on the blocker's edge) and
 * `far1` / `far2` are those tangent rays extended by `farDistance`
 * (default 1000 inches — beyond any court dimension). Returns `null` if
 * the viewpoint is on or inside the blocker.
 *
 * The polygon's "open" edge `t2 → t1` cuts across the blocker; rendering
 * the polygon over a disc darkens the disc's back arc, producing a
 * natural lit-from-the-front shading.
 */
export function shadowPolygon(
  viewpoint: Point,
  center: Point,
  radius: number,
  farDistance: number = SHADOW_FAR_DISTANCE,
): [Point, Point, Point, Point] | null {
  const tangents = tangentPoints(viewpoint, center, radius);
  if (!tangents) return null;
  const [t1, t2] = tangents;
  return [
    t1,
    extend(viewpoint, t1, farDistance),
    extend(viewpoint, t2, farDistance),
    t2,
  ];
}

function extend(from: Point, through: Point, distance: number): Point {
  const dx = through.x - from.x;
  const dy = through.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return through;
  return {
    x: through.x + (dx / len) * distance,
    y: through.y + (dy / len) * distance,
  };
}
