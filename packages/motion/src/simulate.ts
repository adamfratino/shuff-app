/**
 * Shot simulation: Coulomb friction plus equal-mass elastic collisions,
 * stepped to rest. The numeric half of the Jam model — the same physics
 * `physics.ts` expresses analytically — ported from the shuffleboardjam.com
 * reference (constant deceleration μ, full exchange of the contact-normal
 * component of relative velocity, no restitution factor). Run numerically
 * because multi-disc collision outcomes have no closed form.
 */

import {
  type Disc,
  DISC_RADIUS,
  HALF_COURT_WIDTH,
  isAlive,
} from "@shuff/core";
import { DEFAULT_MU } from "./physics";
import type { Shot, ShotResult, SimulateShotOptions } from "./types";

/** Speed (in/s) below which a gliding disc is considered stopped. */
const STOP_THRESHOLD = 0.1;

type SimDisc = {
  source: Disc | null; // null marks the shooter's disc
  x: number;
  y: number;
  vx: number;
  vy: number;
  moving: boolean;
  removed: boolean;
};

const DT = 1 / 30;
const MAX_STEPS = 600;
/**
 * Longest substep drift integrates cleanly over. Friction couples the two
 * axes, so a curved glide needs a fine step even when the disc is slow —
 * the adaptive collision substepping alone (sized to prevent tunneling) is
 * too coarse and would make a drifted rest point depend on frame rate.
 */
const DRIFT_SUB_DT = 1 / 240;

/**
 * Simulates `shot` against `board` until every disc is at rest.
 *
 * The shooter's new disc takes `shooter`'s `color`/`id` (color should be
 * the shooter's; id is optional, as in `@shuff/core`). Discs die when they
 * leave the court over a side line or fully past the back baseline
 * (removed mid-flight — a fallen disc can't be hit), or come to rest short
 * of the lag line (`isAlive`). Surviving discs are returned with their
 * original `color`/`id` and final positions.
 */
export function simulateShot(
  board: readonly Disc[],
  shot: Shot,
  shooter: Pick<Disc, "color" | "id">,
  options: SimulateShotOptions = {},
): ShotResult {
  const { courtSpeed = DEFAULT_MU, drift } = options;
  const dx = shot.aim.x - shot.start.x;
  const dy = shot.aim.y - shot.start.y;
  const len = Math.hypot(dx, dy);

  const discs: SimDisc[] = board.map((d) => ({
    source: d,
    x: d.x,
    y: d.y,
    vx: 0,
    vy: 0,
    moving: false,
    removed: false,
  }));
  discs.push({
    source: null,
    x: shot.start.x,
    y: shot.start.y,
    vx: len === 0 ? 0 : (dx / len) * shot.speed,
    vy: len === 0 ? 0 : (dy / len) * shot.speed,
    moving: len > 0 && shot.speed > 0,
    removed: false,
  });

  for (let step = 0; step < MAX_STEPS; step++) {
    if (discs.every((d) => !d.moving || d.removed)) break;

    // Adaptive sub-stepping: no disc travels more than one diameter per
    // substep, so fast shots can't tunnel through other discs.
    let maxSpeed = 0;
    for (const d of discs) {
      if (d.moving && !d.removed) {
        maxSpeed = Math.max(maxSpeed, Math.hypot(d.vx, d.vy));
      }
    }
    const substeps = Math.max(
      1,
      Math.ceil((maxSpeed * DT) / (DISC_RADIUS * 2)),
      drift ? Math.ceil(DT / DRIFT_SUB_DT) : 1,
    );
    const subDt = DT / substeps;

    for (let s = 0; s < substeps; s++) {
      // Friction + integration (trapezoidal in v)
      for (const d of discs) {
        if (!d.moving || d.removed) continue;
        // Court drift (a downhill bias) is an external acceleration applied
        // before friction, so friction then opposes the drift-adjusted
        // velocity — the path bends more as the disc slows.
        if (drift) {
          d.vx += drift.x * subDt;
          d.vy += drift.y * subDt;
        }
        const speed = Math.hypot(d.vx, d.vy);
        if (speed < STOP_THRESHOLD) {
          d.vx = 0;
          d.vy = 0;
          d.moving = false;
          continue;
        }
        const newSpeed = Math.max(0, speed - courtSpeed * subDt);
        const ratio = newSpeed / speed;
        const oldVx = d.vx;
        const oldVy = d.vy;
        d.vx *= ratio;
        d.vy *= ratio;
        d.x += (oldVx + d.vx) * 0.5 * subDt;
        d.y += (oldVy + d.vy) * 0.5 * subDt;
      }

      // Equal-mass elastic collisions: full exchange of the contact-normal
      // component of relative velocity. A dead-center hit sticks the shooter.
      const active = discs.filter((d) => !d.removed);
      for (let i = 0; i < active.length; i++) {
        for (let j = i + 1; j < active.length; j++) {
          const a = active[i]!;
          const b = active[j]!;
          const abx = b.x - a.x;
          const aby = b.y - a.y;
          const dist = Math.hypot(abx, aby);
          if (dist >= DISC_RADIUS * 2 || dist === 0) continue;
          const nx = abx / dist;
          const ny = aby / dist;
          const overlap = DISC_RADIUS * 2 - dist;
          a.x -= (overlap / 2) * nx;
          a.y -= (overlap / 2) * ny;
          b.x += (overlap / 2) * nx;
          b.y += (overlap / 2) * ny;
          const dvn = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
          if (dvn <= 0) continue;
          a.vx -= dvn * nx;
          a.vy -= dvn * ny;
          b.vx += dvn * nx;
          b.vy += dvn * ny;
          a.moving = true;
          b.moving = true;
        }
      }

      // Off-court removal, mid-flight: over a side line or fully past the
      // back baseline. (Short-of-lag-line death is judged at rest, below.)
      for (const d of discs) {
        if (d.removed) continue;
        if (
          d.x - DISC_RADIUS < 0 ||
          d.x + DISC_RADIUS > HALF_COURT_WIDTH ||
          d.y + DISC_RADIUS < 0
        ) {
          d.removed = true;
          d.moving = false;
          d.vx = 0;
          d.vy = 0;
        }
      }
    }
  }

  const boardOut: Disc[] = [];
  const dead: Disc[] = [];
  let shooterOut: Disc | null = null;
  for (const d of discs) {
    const disc: Disc =
      d.source === null
        ? { ...shooter, x: d.x, y: d.y }
        : { ...d.source, x: d.x, y: d.y };
    // The shooter's staged disc starts beyond the lag line; only judge
    // liveness once it has actually been shot up-court.
    const died =
      d.removed || (isAliveApplies(d) ? !isAlive(disc) : false);
    if (died) {
      dead.push(disc);
    } else {
      boardOut.push(disc);
      if (d.source === null) shooterOut = disc;
    }
  }
  return { board: boardOut, dead, shooter: shooterOut };
}

function isAliveApplies(d: SimDisc): boolean {
  // A disc that never left the staging area (zero-speed shot) is not on
  // the played surface; everything else is judged by the liveness rule.
  return !(d.source === null && d.y >= 229);
}
