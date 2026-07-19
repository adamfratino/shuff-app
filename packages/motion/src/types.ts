import type { Disc } from "@shuff/core";

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
