import type { Disc, Point } from "@shuff/core";

/**
 * A disc with a required stable identity. Animation needs to know that
 * *this* disc in one board state is *that* disc in the next — `@shuff/core`
 * leaves `id` optional, but everything in @shuff/motion requires it.
 */
export type TrackedDisc = Disc & { id: string };

/**
 * A board at rest: the discs on the target end, in z-order (later entries
 * draw on top). Per docs/RULES.md, disc identity is stable across a
 * Sequence — ids must not be reused within one.
 */
export type BoardState = readonly TrackedDisc[];

/**
 * A shot, fully determined: released from `start`, aimed along the line
 * toward `aim`, at `speed` inches/second.
 *
 * `speed` is explicit rather than implied by the aim point because
 * through-shots budget for the struck disc's onward travel: a kitchen shot
 * aims at the contact point but launches with enough speed to carry the
 * target the rest of the way.
 */
export type Shot = {
  start: Point;
  aim: Point;
  speed: number;
};

/**
 * Outcome of simulating a shot to rest.
 *
 * `board` is every surviving disc — displaced originals (same `id`/`color`,
 * new positions) plus the shooter's disc if it survived. `dead` lists discs
 * removed during or after the shot (off the sides, off the back, or at rest
 * short of the lag line). `shooter` points at the shooter's disc inside
 * `board`, or is `null` if it died.
 */
export type ShotResult = {
  board: Disc[];
  dead: Disc[];
  shooter: Disc | null;
};

export type SimulateShotOptions = {
  /**
   * Court friction — the deceleration a gliding disc experiences, in
   * inches/second². Lower is a faster (beaded) court. Defaults to
   * `DEFAULT_MU`.
   */
  courtSpeed?: number;

  /**
   * Constant court bias, in inches/second² — an outdoor court's downhill
   * lean. Added to every moving disc each step; friction still opposes the
   * disc's actual velocity, so a drifting disc runs nearly true at speed and
   * hooks toward the low side as it slows. Keep its magnitude below
   * `courtSpeed` or discs never come to rest. Omitted means a level court.
   */
  drift?: Point;
};

export type BoardTransitionOptions = {
  /**
   * Court friction — the deceleration a gliding disc experiences, in
   * inches/second². Lower is a faster (beaded) court: discs take longer,
   * flatter glides to cover the same distance. Defaults to `DEFAULT_MU`.
   */
  courtSpeed?: number;

  /**
   * Force reduced motion on or off. When omitted, follows the user's
   * `prefers-reduced-motion` setting; when reduced, discs snap to their
   * target positions instead of gliding.
   */
  reducedMotion?: boolean;
};
