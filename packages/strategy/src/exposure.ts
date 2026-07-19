/**
 * Exposure: the geometric risk model at the heart of the strategy
 * (docs/STRATEGY.md § Decision Principles). A scorer is *exposed* when an
 * unblocked line from an opponent shooting slot can drive it kitchen-ward
 * (kitchen exposure) or merely reach it (clear exposure). Blocking every
 * line drives the estimate to zero — which is why guards and snuggles win.
 */

import { type Disc, DISC_RADIUS, type Point, zoneAt } from "@shuff/core";
import { distToSegment } from "./aim";
import {
  P_CLEAR_BASE,
  P_KITCHEN_BASE,
  P_MAX,
  P_MULTI_LINE_BONUS,
} from "./constants";

/**
 * Sample depths (y) at which a kitchen-bound ray is tested — spread across
 * the kitchen's 18-inch depth.
 */
const KITCHEN_SAMPLE_YS = [2, 6, 10, 14] as const;

function lineBlocked(
  start: Point,
  target: Disc,
  board: readonly Disc[],
): boolean {
  for (const d of board) {
    if (d === target) continue;
    if (distToSegment(d, start, target) < DISC_RADIUS * 2) return true;
  }
  return false;
}

/**
 * Estimated probability that the opponent, shooting from one of
 * `opponentStarts`, can knock `target` into the kitchen on their next
 * shot.
 *
 * A slot contributes a line when (1) extending the ray slot → target
 * reaches the kitchen, and (2) no other disc on `board` blocks the
 * segment slot → target. One clean line is worth `P_KITCHEN_BASE`; extra
 * lines add a small angle-selection bonus, capped at `P_MAX`. Zero lines →
 * zero exposure.
 */
export function kitchenExposure(
  target: Disc,
  board: readonly Disc[],
  opponentStarts: readonly Point[],
): number {
  let lines = 0;
  for (const start of opponentStarts) {
    const dx = target.x - start.x;
    const dy = target.y - start.y;
    const len = Math.hypot(dx, dy);
    if (len < 1 || Math.abs(dy / len) < 0.001) continue;
    const ndx = dx / len;
    const ndy = dy / len;

    let reachesKitchen = false;
    for (const y of KITCHEN_SAMPLE_YS) {
      const t = (y - start.y) / ndy;
      if (t <= len) continue; // kitchen point not beyond the target
      if (zoneAt(start.x + ndx * t, y) === "kitchen") {
        reachesKitchen = true;
        break;
      }
    }
    if (!reachesKitchen) continue;
    if (lineBlocked(start, target, board)) continue;
    lines++;
  }
  if (lines === 0) return 0;
  return Math.min(P_MAX, P_KITCHEN_BASE * (1 + (lines - 1) * P_MULTI_LINE_BONUS));
}

/**
 * Estimated probability that the opponent can knock `target` off the court
 * without kitchening it — any unblocked line to the disc suffices, so no
 * kitchen-reachability condition applies.
 */
export function clearExposure(
  target: Disc,
  board: readonly Disc[],
  opponentStarts: readonly Point[],
): number {
  let lines = 0;
  for (const start of opponentStarts) {
    if (!lineBlocked(start, target, board)) lines++;
  }
  if (lines === 0) return 0;
  return Math.min(P_MAX, P_CLEAR_BASE * (1 + (lines - 1) * P_MULTI_LINE_BONUS));
}
