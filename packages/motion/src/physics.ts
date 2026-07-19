/**
 * Floor-shuffleboard motion physics: Coulomb friction (constant
 * deceleration) and the exact easing curves it induces.
 *
 * A disc released at speed `v` on a court with friction `μ` decelerates
 * linearly, covering `v²/2μ` before stopping in `v/μ` seconds. Constant
 * deceleration traces an exact quadratic ease-out — so a physical glide is
 * one Motion animation with `EASE_GLIDE`, and a disc's speed at any moment
 * falls out of the friction law analytically. Reference model:
 * https://shuffleboardjam.com/ (see packages/motion/PLAN.md).
 */

/**
 * Default court friction: deceleration in inches/second². This is the
 * court-speed knob — lower μ is a faster (beaded) court.
 */
export const DEFAULT_MU = 160;

/** Exact `t²` — a disc accelerating uniformly, e.g. through the cue stroke. */
export const EASE_STROKE: [number, number, number, number] = [
  0.33, 0, 0.67, 0.33,
];

/** Exact `1-(1-t)²` — a disc decelerating uniformly under friction. */
export const EASE_GLIDE: [number, number, number, number] = [
  0.33, 0.67, 0.67, 1,
];

/**
 * Repositioning profile for board transitions: a gentle start into a
 * friction-style ease-out. Not a shot — use EASE_STROKE + EASE_GLIDE
 * segments when animating actual play.
 */
export const EASE_TRAVEL: [number, number, number, number] = [0.35, 0, 0.25, 1];

/** Release speed (in/s) that friction brings to rest in exactly `dist` inches. */
export function launchSpeed(dist: number, mu: number = DEFAULT_MU): number {
  return Math.sqrt(2 * mu * Math.max(0, dist));
}

/** Distance (inches) a disc released at `speed` glides before stopping. */
export function glideLength(speed: number, mu: number = DEFAULT_MU): number {
  return (speed * speed) / (2 * mu);
}

/** Seconds a glide over `dist` inches takes: `√(2·dist/μ)`. */
export function glideDuration(dist: number, mu: number = DEFAULT_MU): number {
  if (dist <= 0) return 0;
  return launchSpeed(dist, mu) / mu;
}
