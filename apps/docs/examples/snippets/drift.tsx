import type { Point } from "@shuff/core";

// Drift is a tilted court: a constant downhill acceleration (in/s²) layered
// onto the friction glide. Because friction opposes the disc's *actual*
// velocity, the bias tells more as the disc slows — so it runs nearly true
// at speed, then hooks toward the low side. You aim up-slope to answer it.
const MU = 160; // court speed
const DRIFT: Point = { x: 32, y: 0 }; // the court leans right

// One physics step: drift first, then Coulomb friction — capped so it can
// only bring the disc to rest, never reverse it — then integrate position.
export function step(p: Point, v: Point, dt: number) {
  v.x += DRIFT.x * dt;
  v.y += DRIFT.y * dt;
  const s = Math.hypot(v.x, v.y);
  const dec = Math.min(MU * dt, s);
  v.x -= (v.x / s) * dec;
  v.y -= (v.y / s) * dec;
  p.x += v.x * dt;
  p.y += v.y * dt;
}
