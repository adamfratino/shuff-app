/**
 * Candidate generation: one generator per named shot in the taxonomy
 * (docs/STRATEGY.md § Shot Taxonomy). Generators are pure geometry — they
 * propose plausible aim points; the Monte Carlo evaluator decides which
 * candidate actually wins the turn.
 */

import {
  type Disc,
  DISC_DIAMETER,
  DISC_RADIUS,
  HALF_COURT_WIDTH,
  LAG_LINE_Y,
  type Point,
  score,
  type ScoringZone,
  scoringZone,
  zoneAt,
} from "@shuff/core";
import {
  carrySpeed,
  exactSpeed,
  ghostBall,
  kitchenLanding,
} from "./aim";
import { HARD_FACTOR, resolveOptions } from "./constants";
import type {
  ResolvedStrategyOptions,
  ShotCandidate,
  StrategyOptions,
} from "./types";

/**
 * Canonical interior aim point per scoring zone — deep enough that a disc
 * stopping there scores with clearance to every line.
 */
export const ZONE_TARGETS: Record<ScoringZone, Point> = {
  kitchen: { x: 36, y: 9 },
  "7-left": { x: 21, y: 36 },
  "7-right": { x: 51, y: 36 },
  "8-left": { x: 27, y: 72 },
  "8-right": { x: 45, y: 72 },
  "10": { x: 36, y: 104 },
};

/**
 * Aim-point spread applied around each geometric ideal, in inches of x.
 * Lets the evaluator discover glancing-contact variants of a shot. (The
 * reference model sweeps ±24 to compensate court drift; drift courts are
 * out of scope here, so a tight spread suffices.)
 */
const OFFSETS = [-6, -3, 0, 3, 6] as const;

/** Grid pitch for plain placement candidates, in inches. */
const SCORE_GRID_STEP = 6;

/**
 * Carry inflation for ghost-ball shots. A ghost-ball contact is slightly
 * glancing (the approach line isn't the deflection line), so only cos²θ
 * of the stopping distance transfers — undershooting leaves the struck
 * disc touching a line. Overshooting into a zone's interior is safe.
 */
const GLANCING_CARRY = 1.12;

/** Keep placements off the rails: exclude aim x within 9" of a side line. */
const RAIL_MARGIN = 9;

const scores = (d: Disc) => score(d) > 0;

function partition(board: readonly Disc[], color: string) {
  const mine: Disc[] = [];
  const theirs: Disc[] = [];
  for (const d of board) (d.color === color ? mine : theirs).push(d);
  return { mine, theirs };
}

function onCourtX(x: number): boolean {
  return x >= DISC_RADIUS && x <= HALF_COURT_WIDTH - DISC_RADIUS;
}

/**
 * `score` — placement candidates on a grid over every positive scoring
 * zone, from every start slot.
 */
export function scoreCandidates(
  options: Pick<ResolvedStrategyOptions, "starts" | "courtSpeed">,
): ShotCandidate[] {
  const out: ShotCandidate[] = [];
  for (let y = 18 + DISC_RADIUS; y <= 126; y += SCORE_GRID_STEP) {
    for (
      let x = RAIL_MARGIN;
      x <= HALF_COURT_WIDTH - RAIL_MARGIN;
      x += SCORE_GRID_STEP
    ) {
      const zone = scoringZone({ x, y, color: "" });
      if (zone === null || zone === "kitchen") continue;
      for (const start of options.starts) {
        const aim = { x, y };
        out.push({
          start,
          aim,
          speed: exactSpeed(start, aim, options.courtSpeed),
          intent: "score",
        });
      }
    }
  }
  return out;
}

/**
 * `kitchen` — drive an opponent disc into the 10-off. Line-extension
 * variants shoot straight through the disc at a landing point inside the
 * kitchen; ghost-ball variants aim at the contact position that deflects
 * the disc toward the kitchen's center, with the speed budgeted to carry
 * it there.
 */
export function kitchenCandidates(
  board: readonly Disc[],
  options: Pick<ResolvedStrategyOptions, "starts" | "courtSpeed" | "color">,
): ShotCandidate[] {
  const { theirs } = partition(board, options.color);
  const out: ShotCandidate[] = [];
  const kitchenTarget = ZONE_TARGETS.kitchen;

  for (const opp of theirs) {
    if (score(opp) === -10) continue; // already in the kitchen

    // Line extension: start → disc → kitchen, when collinear enough.
    for (const start of options.starts) {
      const landing = kitchenLanding(start, opp);
      if (landing === null) continue;
      for (const xOff of OFFSETS) {
        const aim = { x: landing.x + xOff, y: landing.y };
        if (zoneAt(aim.x, aim.y) !== "kitchen") continue;
        out.push({
          start,
          aim,
          speed: exactSpeed(start, aim, options.courtSpeed),
          intent: "kitchen",
        });
      }
    }

    // Ghost ball: works for any geometry, not just collinear.
    const ghost = ghostBall(opp, kitchenTarget);
    if (ghost !== null && ghost.y < 226 && ghost.y > DISC_RADIUS) {
      const carry =
        GLANCING_CARRY *
        Math.hypot(kitchenTarget.x - opp.x, kitchenTarget.y - opp.y);
      for (const start of options.starts) {
        for (const xOff of OFFSETS) {
          const aim = { x: ghost.x + xOff, y: ghost.y };
          if (!onCourtX(aim.x)) continue;
          out.push({
            start,
            aim,
            speed: carrySpeed(start, aim, carry, options.courtSpeed),
            intent: "kitchen",
          });
        }
      }
    }
  }
  return out;
}

/**
 * `clear` / `hard-clear` — knock an opponent scorer off the court. The
 * controlled clear budgets exactly enough carry to push the target past
 * the back baseline (the shooter sticks near the contact); the hard clear
 * trades placement for certainty at 1.5× speed.
 */
export function clearCandidates(
  board: readonly Disc[],
  options: Pick<ResolvedStrategyOptions, "starts" | "courtSpeed" | "color">,
): ShotCandidate[] {
  const { theirs } = partition(board, options.color);
  const out: ShotCandidate[] = [];
  for (const opp of theirs.filter(scores)) {
    const carry = opp.y + DISC_DIAMETER; // past the back baseline, with slack
    for (const start of options.starts) {
      for (const xOff of OFFSETS) {
        const aim = { x: opp.x + xOff, y: opp.y };
        if (!onCourtX(aim.x)) continue;
        out.push({
          start,
          aim,
          speed: carrySpeed(start, aim, carry, options.courtSpeed),
          intent: "clear",
        });
      }
      out.push({
        start,
        aim: { x: opp.x, y: opp.y },
        speed: HARD_FACTOR * exactSpeed(start, opp, options.courtSpeed),
        intent: "hard-clear",
      });
    }
  }
  return out;
}

/**
 * `bump` — one of my discs is resting on a line, scoring nothing: nudge it
 * to the containing zone's interior via ghost ball, budgeting just enough
 * carry to reach the zone target.
 */
export function bumpCandidates(
  board: readonly Disc[],
  options: Pick<ResolvedStrategyOptions, "starts" | "courtSpeed" | "color">,
): ShotCandidate[] {
  const { mine } = partition(board, options.color);
  const out: ShotCandidate[] = [];
  for (const disc of mine) {
    if (scoringZone(disc) !== null) continue; // already scoring cleanly
    const zone = zoneAt(disc.x, disc.y);
    if (zone === "kitchen" || !(zone in ZONE_TARGETS)) continue;
    const target = ZONE_TARGETS[zone as ScoringZone];
    const ghost = ghostBall(disc, target);
    if (ghost === null || ghost.y >= 226) continue;
    const carry = Math.hypot(target.x - disc.x, target.y - disc.y);
    for (const start of options.starts) {
      for (const xOff of OFFSETS) {
        const aim = { x: ghost.x + xOff, y: ghost.y };
        if (!onCourtX(aim.x)) continue;
        out.push({
          start,
          aim,
          speed: carrySpeed(start, aim, carry, options.courtSpeed),
          intent: "bump",
        });
      }
    }
  }
  return out;
}

/**
 * `snuggle` — park my disc one diameter in front of an opponent scorer
 * (shooter side), so any attack on mine drives it into theirs.
 */
export function snuggleCandidates(
  board: readonly Disc[],
  options: Pick<ResolvedStrategyOptions, "starts" | "courtSpeed" | "color">,
): ShotCandidate[] {
  const { theirs } = partition(board, options.color);
  const out: ShotCandidate[] = [];
  for (const opp of theirs.filter(scores)) {
    const y = opp.y + DISC_DIAMETER + 0.5;
    if (y > LAG_LINE_Y) continue; // a snuggle past the lag line is dead
    for (const start of options.starts) {
      for (const xOff of OFFSETS) {
        const aim = { x: opp.x + xOff, y };
        if (!onCourtX(aim.x)) continue;
        out.push({
          start,
          aim,
          speed: exactSpeed(start, aim, options.courtSpeed),
          intent: "snuggle",
        });
      }
    }
  }
  return out;
}

/**
 * `block` — guard my scorer: place a disc ~10" in front of it along each
 * opponent shooting line, cutting the line of sight.
 */
export function blockCandidates(
  board: readonly Disc[],
  options: Pick<
    ResolvedStrategyOptions,
    "starts" | "opponentStarts" | "courtSpeed" | "color"
  >,
): ShotCandidate[] {
  const { mine } = partition(board, options.color);
  const out: ShotCandidate[] = [];
  for (const scorer of mine.filter(scores)) {
    for (const oppStart of options.opponentStarts) {
      const dx = scorer.x - oppStart.x;
      const dy = scorer.y - oppStart.y;
      const len = Math.hypot(dx, dy);
      if (len < 1) continue;
      const guard = {
        x: scorer.x - (dx / len) * 10,
        y: scorer.y - (dy / len) * 10,
      };
      if (guard.y < DISC_RADIUS || guard.y > LAG_LINE_Y) continue;
      for (const start of options.starts) {
        for (const xOff of OFFSETS) {
          const aim = { x: guard.x + xOff, y: guard.y };
          if (!onCourtX(aim.x)) continue;
          out.push({
            start,
            aim,
            speed: exactSpeed(start, aim, options.courtSpeed),
            intent: "block",
          });
        }
      }
    }
  }
  return out;
}

/**
 * `kitchen-replace` — I have a disc at −10 and the opponent has a disc to
 * swap in: ghost-ball the opponent disc into my kitchen disc, knocking
 * mine out and leaving theirs in the kitchen.
 */
export function kitchenReplaceCandidates(
  board: readonly Disc[],
  options: Pick<ResolvedStrategyOptions, "starts" | "courtSpeed" | "color">,
): ShotCandidate[] {
  const { mine, theirs } = partition(board, options.color);
  const myKitchen = mine.filter((d) => score(d) === -10);
  const out: ShotCandidate[] = [];
  for (const kitchenDisc of myKitchen) {
    for (const opp of theirs) {
      if (score(opp) === -10) continue; // theirs is already in — no gain
      const ghost = ghostBall(opp, kitchenDisc);
      if (ghost === null || ghost.y >= 226 || ghost.y < DISC_RADIUS) continue;
      const carry =
        GLANCING_CARRY *
        Math.hypot(kitchenDisc.x - opp.x, kitchenDisc.y - opp.y);
      for (const start of options.starts) {
        for (const xOff of OFFSETS) {
          const aim = { x: ghost.x + xOff, y: ghost.y };
          if (!onCourtX(aim.x)) continue;
          out.push({
            start,
            aim,
            speed: carrySpeed(start, aim, carry, options.courtSpeed),
            intent: "kitchen-replace",
          });
        }
      }
    }
  }
  return out;
}

/**
 * `kitchen-clear` — rescue my own −10 disc with a hard shot off the court:
 * losing the disc (0) beats keeping it at −10.
 */
export function kitchenClearCandidates(
  board: readonly Disc[],
  options: Pick<ResolvedStrategyOptions, "starts" | "courtSpeed" | "color">,
): ShotCandidate[] {
  const { mine } = partition(board, options.color);
  const out: ShotCandidate[] = [];
  for (const disc of mine) {
    if (score(disc) !== -10) continue;
    for (const start of options.starts) {
      for (const xOff of OFFSETS) {
        const aim = { x: disc.x + xOff, y: disc.y };
        if (!onCourtX(aim.x)) continue;
        out.push({
          start,
          aim,
          speed: HARD_FACTOR * exactSpeed(start, aim, options.courtSpeed),
          intent: "kitchen-clear",
        });
      }
    }
  }
  return out;
}

/**
 * `sweep` / `hard-sweep` — two or more opponent scorers share a zone: aim
 * through the nearest into the cluster's center of mass so one shot
 * dislodges several.
 */
export function sweepCandidates(
  board: readonly Disc[],
  options: Pick<ResolvedStrategyOptions, "starts" | "courtSpeed" | "color">,
): ShotCandidate[] {
  const { theirs } = partition(board, options.color);
  const byZone = new Map<ScoringZone, Disc[]>();
  for (const opp of theirs) {
    const zone = scoringZone(opp);
    if (zone === null || zone === "kitchen") continue;
    const cluster = byZone.get(zone) ?? [];
    cluster.push(opp);
    byZone.set(zone, cluster);
  }

  const out: ShotCandidate[] = [];
  for (const cluster of byZone.values()) {
    if (cluster.length < 2) continue;
    const com = {
      x: cluster.reduce((s, d) => s + d.x, 0) / cluster.length,
      y: cluster.reduce((s, d) => s + d.y, 0) / cluster.length,
    };
    for (const start of options.starts) {
      const nearest = [...cluster].sort(
        (a, b) =>
          Math.hypot(a.x - start.x, a.y - start.y) -
          Math.hypot(b.x - start.x, b.y - start.y),
      )[0]!;
      const punch = Math.hypot(com.x - nearest.x, com.y - nearest.y) + 30;

      // Through the cluster's center of mass...
      const comGhost = ghostBall(nearest, com);
      if (comGhost !== null && comGhost.y < 226 && comGhost.y > DISC_RADIUS) {
        for (const xOff of OFFSETS) {
          const aim = { x: comGhost.x + xOff, y: comGhost.y };
          if (!onCourtX(aim.x)) continue;
          out.push({
            start,
            aim,
            speed: carrySpeed(start, aim, punch, options.courtSpeed),
            intent: "sweep",
          });
        }
        out.push({
          start,
          aim: comGhost,
          speed: HARD_FACTOR * exactSpeed(start, comGhost, options.courtSpeed),
          intent: "hard-sweep",
        });
      }

      // ...and straight along the natural shooting line (blow-through).
      const aimThrough = { x: nearest.x, y: nearest.y };
      out.push({
        start,
        aim: aimThrough,
        speed: carrySpeed(start, aimThrough, punch, options.courtSpeed),
        intent: "sweep",
      });
    }
  }
  return out;
}

/**
 * `ten-block` — second-to-last shot only: park a disc in the opponent's
 * approach lane to the 10 zone, denying the hammer its best target.
 */
export function tenBlockCandidates(
  options: Pick<
    ResolvedStrategyOptions,
    "starts" | "opponentStarts" | "courtSpeed"
  >,
): ShotCandidate[] {
  const ten = ZONE_TARGETS["10"];
  const laneY = 140;
  const out: ShotCandidate[] = [];
  for (const oppStart of options.opponentStarts) {
    const t = (oppStart.y - laneY) / (oppStart.y - ten.y);
    const laneX = oppStart.x + t * (ten.x - oppStart.x);
    for (const start of options.starts) {
      for (const xOff of OFFSETS) {
        const aim = { x: laneX + xOff, y: laneY };
        if (!onCourtX(aim.x)) continue;
        out.push({
          start,
          aim,
          speed: exactSpeed(start, aim, options.courtSpeed),
          intent: "ten-block",
        });
      }
    }
  }
  return out;
}

/**
 * Every candidate the current board admits, gated the way a player gates
 * them: attacking shots need opponent discs, rescues need a disc at −10,
 * `ten-block` only exists on shot 7.
 */
export function allCandidates(
  board: readonly Disc[],
  options: StrategyOptions,
): ShotCandidate[] {
  const resolved = resolveOptions(options);
  const out: ShotCandidate[] = [
    ...scoreCandidates(resolved),
    ...kitchenCandidates(board, resolved),
    ...clearCandidates(board, resolved),
    ...bumpCandidates(board, resolved),
    ...snuggleCandidates(board, resolved),
    ...blockCandidates(board, resolved),
    ...kitchenReplaceCandidates(board, resolved),
    ...kitchenClearCandidates(board, resolved),
    ...sweepCandidates(board, resolved),
  ];
  if (resolved.shotNumber === 7) {
    out.push(...tenBlockCandidates(resolved));
  }
  return out;
}
