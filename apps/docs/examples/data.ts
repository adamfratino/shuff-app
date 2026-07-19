import type { Disc, Point } from "@shuff/core";
import type { TrackedDisc } from "@shuff/motion";
import { BLACK, YELLOW } from "./_shared";

/** A representative 8-disc frame — 4 yellow + 4 black, with doubled-up zones. */
export const sampleFrame: Disc[] = [
  { x: 36, y: 108, color: YELLOW }, // 10
  { x: 54, y: 38, color: YELLOW }, // 7-right
  { x: 12, y: 25, color: YELLOW }, // 7-left
  { x: 20, y: 50, color: BLACK }, // 7-left
  { x: 42, y: 64, color: YELLOW }, // 8-right
  { x: 46, y: 80, color: BLACK }, // 8-right
  { x: 28, y: 72, color: BLACK }, // 8-left
  { x: 22, y: 10, color: BLACK }, // kitchen
];

/**
 * One disc at each corner of each scoring area, just inside the 3.5"
 * clearance from both intersecting lines — every disc scores.
 */
export const cornerDiscs: Disc[] = [
  // Kitchen — 4 corners
  { x: 5, y: 3.6, color: YELLOW },
  { x: 67, y: 3.6, color: YELLOW },
  { x: 8.6, y: 14.4, color: YELLOW },
  { x: 63.4, y: 14.4, color: YELLOW },
  // 7-left
  { x: 5, y: 21.6, color: YELLOW },
  { x: 32.4, y: 21.6, color: YELLOW },
  { x: 32.4, y: 50.4, color: YELLOW },
  { x: 14.7, y: 50.4, color: YELLOW },
  // 7-right
  { x: 39.6, y: 21.6, color: YELLOW },
  { x: 67, y: 21.6, color: YELLOW },
  { x: 57.3, y: 50.4, color: YELLOW },
  { x: 39.6, y: 50.4, color: YELLOW },
  // 8-left
  { x: 17, y: 57.6, color: YELLOW },
  { x: 32.4, y: 57.6, color: YELLOW },
  { x: 32.4, y: 86.4, color: YELLOW },
  { x: 26.6, y: 86.4, color: YELLOW },
  // 8-right
  { x: 39.6, y: 57.6, color: YELLOW },
  { x: 55, y: 57.6, color: YELLOW },
  { x: 45.4, y: 86.4, color: YELLOW },
  { x: 39.6, y: 86.4, color: YELLOW },
  // 10 zone — 3 corners
  { x: 29, y: 93.6, color: YELLOW },
  { x: 43, y: 93.6, color: YELLOW },
  { x: 36, y: 114.8, color: YELLOW },
];

/** Landmarks tracing the full-court centerline (x=36) from baseline to baseline. */
export const coordPlotDiscs: Disc[] = [
  { x: 36, y: 9, color: "#3b82f6" }, // near-end kitchen middle
  { x: 36, y: 126, color: "#10b981" }, // near-end apex
  { x: 36, y: 162, color: "#f59e0b" }, // near-end lag line
  { x: 36, y: 234, color: "#ef4444" }, // centerline of full court
  { x: 36, y: 306, color: "#f59e0b" }, // far-end lag line
  { x: 36, y: 342, color: "#10b981" }, // far-end apex
  { x: 36, y: 459, color: "#3b82f6" }, // far-end kitchen middle (shooter)
];

export const COORD_PLOT_LEGEND: ReadonlyArray<{
  y: number;
  color: string;
  label: string;
}> = [
  { y: 9, color: "#3b82f6", label: "near-end kitchen middle" },
  { y: 126, color: "#10b981", label: "near-end apex (10 zone tip)" },
  { y: 162, color: "#f59e0b", label: "near-end lag line" },
  { y: 234, color: "#ef4444", label: "centerline of full court" },
  { y: 306, color: "#f59e0b", label: "far-end lag line" },
  { y: 342, color: "#10b981", label: "far-end apex" },
  { y: 459, color: "#3b82f6", label: "far-end kitchen middle (shooter)" },
];

/** Shooter on the right side of the far-end kitchen. */
export const frameShooter: Point = { x: 50, y: 459 };

/**
 * Four settled blockers plus the yellow glider ("y1") for the motion glide
 * example. Discs carry ids so the animation can address the glider across
 * frames — the identity model @shuff/motion is built on. b1/b3 sit roughly
 * on the glider's line to the apex, inviting chained knock-ons.
 */
export const glideDiscs: Disc[] = [
  { id: "y1", x: 36, y: 220, color: YELLOW },
  { id: "b1", x: 30, y: 70, color: BLACK },
  { id: "b2", x: 44, y: 40, color: BLACK },
  { id: "b3", x: 33, y: 95, color: BLACK },
  { id: "b4", x: 18, y: 35, color: BLACK },
];

/**
 * Named board states for the AnimatedDiagram transition example. Ids
 * correlate discs across states: y1/b1/b2 move between boards, y2 exists
 * only in "crowded" (appears/disappears), and "cleared" removes the black
 * discs entirely.
 */
export const transitionBoards = {
  setup: [
    { id: "y1", x: 36, y: 190, color: YELLOW },
    { id: "b1", x: 30, y: 70, color: BLACK },
    { id: "b2", x: 44, y: 40, color: BLACK },
  ],
  spread: [
    { id: "y1", x: 36, y: 108, color: YELLOW },
    { id: "b1", x: 20, y: 50, color: BLACK },
    { id: "b2", x: 60, y: 30, color: BLACK },
  ],
  crowded: [
    { id: "y1", x: 54, y: 38, color: YELLOW },
    { id: "b1", x: 33, y: 95, color: BLACK },
    { id: "b2", x: 12, y: 25, color: BLACK },
    { id: "y2", x: 36, y: 108, color: YELLOW },
  ],
  cleared: [{ id: "y1", x: 36, y: 190, color: YELLOW }],
} satisfies Record<string, TrackedDisc[]>;

/**
 * Opening positions for the strategy playbook — one small board per named
 * shot, arranged so the tactic is the engine's natural choice. Yellow
 * shoots; black is the opponent. See docs/STRATEGY.md for the taxonomy.
 */
export const playbookBoards = {
  /** Their naked 8 on an open kitchen line. */
  kitchen: [{ id: "b1", x: 30, y: 72, color: BLACK }],
  /** My naked 8 — an 18-point swing waiting to happen. */
  guard: [{ id: "y2", x: 30, y: 72, color: YELLOW }],
  /** Their scorer in the 8-right, inviting a disc parked in front. */
  snuggle: [{ id: "b1", x: 45, y: 80, color: BLACK }],
  /** My disc stuck at −10, their 8 lined up above it. */
  "kitchen-replace": [
    { id: "y2", x: 30, y: 9, color: YELLOW },
    { id: "b1", x: 30, y: 60, color: BLACK },
  ],
  /** Two of their scorers clustered in the 8-left. */
  sweep: [
    { id: "b1", x: 25, y: 62, color: BLACK },
    { id: "b2", x: 31, y: 80, color: BLACK },
  ],
  /** Empty board, last shot of the frame: nothing to fear, take the 10. */
  hammer: [],
} satisfies Record<string, Disc[]>;

/** The exposure example's scorer and the guard that shields it. */
export const exposureScorer: Disc = { id: "y1", x: 30, y: 72, color: YELLOW };
export const exposureGuard: Disc = { id: "y2", x: 29.4, y: 82, color: YELLOW };
