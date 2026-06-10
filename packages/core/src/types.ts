/**
 * A point in full-court coordinates (inches). Used for shooter position
 * and other reference geometry that may live on either end.
 */
export type Point = {
  x: number;
  y: number;
};

/**
 * A disc on the court.
 *
 * Coordinates are in inches, in the half-court coordinate system documented in
 * `docs/RULES.md`:
 *
 *   x ∈ [0, 72]   — 0 at the left side line, 72 at the right side line.
 *                    Centerline at x = 36.
 *   y ∈ [0, 234]  — 0 at the back baseline (top of the half-court rendering),
 *                    increasing forward toward the centerline of the full court.
 *
 * Reference landmarks:
 *   Apex of the 10:  (36, 126)
 *   Lag line:        y = 162
 *   Far edge of half-court (full-court centerline): y = 234
 *
 * Disc identity (for animation, replay scrubbing, reordering) is opt-in via
 * the optional `id` field. When `id` is absent, consumers like @shuff/diagram
 * fall back to array index for React keys — fine for static renders, but
 * reorders and mid-replay add/remove will tear without it.
 */
export type Disc = {
  x: number;
  y: number;
  /**
   * Any valid CSS color string. Traditionally yellow and black per ILSA, but
   * consumers are agnostic — `"red"`, `"#ff5733"`, `"var(--team-1)"`, etc.
   * all work. Color is a presentation choice; this library does not assign
   * meaning to specific values.
   */
  color: string;
  /**
   * Stable identifier for this disc across renders. Required for correct
   * React reconciliation when discs animate, get reordered, or are added
   * and removed mid-sequence. Omit for static renders where the disc array
   * never reorders — consumers should key by index in that case.
   */
  id?: string;
};
