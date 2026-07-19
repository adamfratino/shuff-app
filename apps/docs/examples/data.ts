import type { Disc, Point } from "@shuff/core";
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
 * Two settled blockers plus the yellow glider ("y1") for the motion glide
 * example. Discs carry ids so the animation can address the glider across
 * frames — the identity model @shuff/motion is built on.
 */
export const glideDiscs: Disc[] = [
  { id: "y1", x: 36, y: 220, color: YELLOW },
  { id: "b1", x: 30, y: 70, color: BLACK },
  { id: "b2", x: 44, y: 40, color: BLACK },
];
