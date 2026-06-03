/**
 * A disc placed on a Diagram.
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
 * Disc identity (for animation, replay scrubbing, etc.) is tracked by the
 * Diagram internally. Callers don't pass an `id`.
 */
export type Disc = {
  x: number;
  y: number;
  /**
   * Any valid CSS color string. Traditionally yellow and black per ILSA, but
   * the Diagram is agnostic — `"red"`, `"#ff5733"`, `"var(--team-1)"`, etc.
   * all work. Color is a presentation choice; the Diagram does not assign
   * meaning to specific values.
   */
  color: string;
};

/**
 * Props for the Diagram component — the project's core rendering primitive.
 *
 * A Diagram always depicts the **target end** of the court in canonical
 * orientation: back baseline at the top, apex pointing toward the centerline.
 * It carries no notion of "yellow side" vs "black side" — that's a
 * shooting-end concept, irrelevant when rendering where discs landed.
 */
export type DiagramProps = {
  /**
   * Discs to render on the court. Render order is z-order — later entries
   * draw on top, useful for replays where a later disc settles atop an
   * earlier one (mounted, per ILSA 1.3.2).
   *
   * Defaults to empty (a blank court).
   */
  discs?: Disc[];

  /**
   * Optional className applied to the root <svg> element. Use this to
   * override default fills and strokes via CSS — the SVG exposes IDs for
   * the court surface, each scoring zone, and individual line markings.
   *
   * @example
   *   .my-diagram #zone-10  { fill: var(--ten-color); }
   *   .my-diagram #line-lag { stroke: var(--lag-color); }
   */
  className?: string;
};
