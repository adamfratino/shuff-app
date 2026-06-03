/**
 * A point in full-court coordinates (inches). Used for shooter position
 * and other reference geometry that may live on either end.
 */
export type Point = {
  x: number;
  y: number;
};

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
   * override default fills and strokes via CSS — the SVG exposes classes
   * for the court surface, each scoring zone, and individual line markings.
   *
   * @example
   *   .my-diagram .shuff-zone-10  { fill: var(--ten-color); }
   *   .my-diagram .shuff-lag-line { stroke: var(--lag-color); }
   */
  className?: string;

  /**
   * When true (default), each scoring zone polygon containing at least one
   * fully-scoring disc receives a `shuff-zone--scoring` modifier class and
   * a `--shuff-zone-count` CSS custom property set to the disc count. The
   * default styles use the count to scale fill opacity (more discs in a
   * zone → more intense tint).
   *
   * Set `false` to skip the classification entirely — useful for embeds
   * that want a neutral court without highlight semantics.
   */
  highlightScoring?: boolean;

  /**
   * When true, each disc gets a small `<text>` overlay inside the SVG
   * showing its scoring zone abbreviation (`10`, `8L`, `8R`, `7L`, `7R`,
   * `K`) or `—` for non-scoring positions. Labels live in a
   * `shuff-disc-labels` group; default styles draw white-stroked text
   * below each disc for legibility on any fill.
   *
   * Defaults to `false`.
   */
  showLabels?: boolean;

  /**
   * Court extent to render.
   *
   * - `"half"` (default): the target end only. viewBox `0 0 72 234`.
   * - `"full"`: both ends. viewBox `0 0 72 468`. The far end (y ∈
   *   [234, 468]) mirrors the near end across y = 234 and is wrapped in
   *   a `shuff-far-end` group for selective styling.
   *
   * For v1, discs and scoring still operate in target-end coordinates
   * (y ∈ [0, 234]). Shooter position, opposite-end discs, and full-court
   * scoring are planned follow-ups.
   */
  variant?: "half" | "full";

  /**
   * Position of the shooter, in full-court coordinates. Typically lives
   * in the far end's kitchen (`y ∈ [450, 468]`). When set, the Diagram
   * renders the shooter as a target-style marker and draws faint
   * projection lines from the shooter to each disc — useful for
   * line-of-sight visualization.
   *
   * Works in both `"half"` and `"full"` variants; in half-court mode the
   * shooter typically sits outside the viewBox and projection lines
   * enter through the centerline edge.
   */
  shooter?: Point;

  /**
   * When true (and `shooter` is set), the Diagram renders a translucent
   * "shadow" polygon behind every disc, computed from each disc's
   * tangent lines to the shooter. The shadow polygons are drawn ABOVE
   * the discs, so discs sitting in another disc's shadow appear
   * darkened — producing a spotlight / lit-from-the-shooter effect.
   *
   * Each blocker's polygon overlaps its own back arc, giving every disc
   * a subtle 3D shading.
   *
   * Defaults to `false`.
   */
  showShadows?: boolean;
};
