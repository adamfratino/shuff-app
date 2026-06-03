/**
 * Disc diameter per ILSA specification, in inches.
 */
export const DISC_DIAMETER = 6;

/**
 * Disc radius (half of diameter), in inches. Used for SVG rendering and for
 * collision math (two discs touch when the distance between centers equals
 * `2 * DISC_RADIUS`).
 */
export const DISC_RADIUS = DISC_DIAMETER / 2;

/**
 * Half-court playing-surface dimensions, in inches.
 */
export const HALF_COURT_WIDTH = 72;
export const HALF_COURT_LENGTH = 234;

/**
 * Reference landmarks in the half-court coordinate system. See `docs/RULES.md`.
 */
export const APEX = { x: 36, y: 126 } as const;
export const LAG_LINE_Y = 162;
export const KITCHEN_DEPTH = 18;
