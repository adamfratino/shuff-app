/**
 * Aiming geometry: the two models that cover every named shot
 * (docs/STRATEGY.md § Aiming Geometry).
 *
 * - Line extension: shoot straight through a target disc when the ray
 *   shooter → target, extended, already crosses the destination.
 * - Ghost ball: to send a struck disc toward destination D, the shooter
 *   must at contact occupy the point one disc diameter behind the target
 *   along the line D → target. Aim at that phantom position.
 */

import { DISC_DIAMETER, type Point, zoneAt } from "@shuff/core";
import { launchSpeed } from "@shuff/motion";

/** Distance from point `p` to the segment `a`–`b`, in inches. */
export function distToSegment(p: Point, a: Point, b: Point): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const len2 = abx * abx + aby * aby;
  if (len2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * abx), p.y - (a.y + t * aby));
}

/**
 * The ghost-ball aim point for sending `target` toward `destination`: one
 * disc diameter behind the target on the line from the destination through
 * it. Returns `null` when target and destination are closer than one
 * diameter (no room for a contact that pushes that way).
 */
export function ghostBall(target: Point, destination: Point): Point | null {
  const dx = destination.x - target.x;
  const dy = destination.y - target.y;
  const len = Math.hypot(dx, dy);
  if (len < DISC_DIAMETER) return null;
  return {
    x: target.x - (dx / len) * DISC_DIAMETER,
    y: target.y - (dy / len) * DISC_DIAMETER,
  };
}

/**
 * Walks the ray from `start` through `through`, past the target, and
 * returns the midpoint of its crossing of the kitchen — the
 * line-extension aim point for a kitchen shot. Aiming mid-crossing (not
 * at the kitchen's near edge) leaves clearance on both sides: a disc
 * stopping on the 7/kitchen line scores nothing. Returns `null` if the
 * extension never enters the kitchen (an off-line target needs the ghost
 * ball instead).
 */
export function kitchenLanding(start: Point, through: Point): Point | null {
  const dx = through.x - start.x;
  const dy = through.y - start.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) return null;
  const ndx = dx / len;
  const ndy = dy / len;
  let entry: number | null = null;
  let lastInside: number | null = null;
  for (let t = len + 1; t < len + 300; t += 1) {
    const y = start.y + ndy * t;
    if (y < 0) break;
    if (zoneAt(start.x + ndx * t, y) === "kitchen") {
      if (entry === null) entry = t;
      lastInside = t;
    } else if (entry !== null) {
      break;
    }
  }
  if (entry === null || lastInside === null) return null;
  const mid = (entry + lastInside) / 2;
  return { x: start.x + ndx * mid, y: start.y + ndy * mid };
}

/** Launch speed that stops the shooter's disc exactly at `aim`. */
export function exactSpeed(start: Point, aim: Point, mu?: number): number {
  return launchSpeed(Math.hypot(aim.x - start.x, aim.y - start.y), mu);
}

/**
 * Launch speed for a through-shot: reach `contact` still carrying enough
 * to glide `carry` more inches. Stopping distance is additive in v² —
 * `v₀ = √(2μ(d + carry))` — so this is exact for a full (head-on) hit,
 * where the struck disc inherits the whole contact-normal speed.
 */
export function carrySpeed(
  start: Point,
  contact: Point,
  carry: number,
  mu?: number,
): number {
  const d = Math.hypot(contact.x - start.x, contact.y - start.y);
  return launchSpeed(d + Math.max(0, carry), mu);
}
