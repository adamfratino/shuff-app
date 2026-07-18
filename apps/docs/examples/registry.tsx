import type { ComponentType, ReactNode } from "react";

import { COURT_WIDTH, OcclusionTable, ScoreTable } from "./_shared";
import { cornerDiscs, frameShooter, sampleFrame } from "./data";
import * as Scoring from "./scoring.examples";
import * as DiagramEx from "./diagram.examples";
import * as Spatial from "./spatial.examples";
import * as Mirror from "./mirror.examples";

export type ExampleMeta = {
  /** Stable id, also used as the source-code export name. */
  id: string;
  /** File the source is sliced from, relative to the examples dir. */
  file: string;
  title: string;
  description: string;
  /**
   * The court visual, rendered in the fixed-width left column. A `custom`
   * example receives the rendered code section as children so it can place it
   * within its own layout (e.g. beside the diagram instead of below it).
   */
  Visual: ComponentType<{ children?: ReactNode }>;
  /** Optional data view (score/occlusion table), rendered in the details column. */
  Aside?: ComponentType;
  /** Section header shown above the Aside table (defaults to "Result"). */
  asideLabel?: string;
  /** Names of the data.ts exports this example plots, revealed in a Mock data disclosure. */
  data?: string[];
  /** Width (px) of the court column. */
  courtWidth: number;
  /**
   * Interactive examples own their own two-column body (state is shared across
   * court + controls), so the frame renders them full-width instead of splitting.
   */
  custom?: boolean;
  /** API entry slugs this example is rendered inline beneath. */
  slugs: string[];
  /** When true, also surfaced in the /diagram Court gallery. */
  gallery?: boolean;
};

export const EXAMPLES: ExampleMeta[] = [
  {
    id: "HalfCourt",
    file: "diagram.examples.tsx",
    title: "Half court (default)",
    description:
      "The default variant renders the target end only — back baseline at top, apex toward the centerline. viewBox 0 0 72 234.",
    Visual: DiagramEx.HalfCourt,
    data: ["sampleFrame"],
    Aside: () => <ScoreTable discs={sampleFrame} />,
    asideLabel: "Scores",
    courtWidth: COURT_WIDTH,
    slugs: ["Diagram"],
    gallery: true,
  },
  {
    id: "WithLabels",
    file: "diagram.examples.tsx",
    title: "Zone labels",
    description:
      "showLabels overlays each disc's scoring-zone abbreviation (10, 8L, 8R, 7L, 7R, K) or — for non-scoring positions.",
    Visual: DiagramEx.WithLabels,
    data: ["sampleFrame"],
    Aside: () => <ScoreTable discs={sampleFrame} />,
    asideLabel: "Scores",
    courtWidth: COURT_WIDTH,
    slugs: ["Diagram"],
    gallery: true,
  },
  {
    id: "FullCourt",
    file: "mirror.examples.tsx",
    title: "Full court",
    description:
      'variant="full" renders both ends; the far end mirrors the near end across y = 234. Toggle mirrorEnd to flip the frame across the full-court center (sending discs to the far end) and mirrorSide to flip across the longitudinal centerline (x = 36) — both preserve disc color and chain freely.',
    Visual: Mirror.FullCourt,
    data: ["sampleFrame"],
    courtWidth: COURT_WIDTH,
    custom: true,
    slugs: ["Diagram"],
    gallery: true,
  },
  {
    id: "CornerDiscs",
    file: "scoring.examples.tsx",
    title: "Every scoring corner",
    description:
      "One disc tucked into each corner of every scoring area, just inside the clearance from both intersecting lines. A stress test that every zone resolves and tints independently.",
    Visual: Scoring.CornerDiscs,
    data: ["cornerDiscs"],
    Aside: () => <ScoreTable discs={cornerDiscs} />,
    asideLabel: "Scores",
    courtWidth: COURT_WIDTH,
    slugs: ["Diagram"],
    gallery: true,
  },
  {
    id: "NeutralCourt",
    file: "diagram.examples.tsx",
    title: "Neutral (no highlights)",
    description:
      "highlightScoring={false} skips the per-zone scoring tint — a plain court for embeds that don't want highlight semantics.",
    Visual: DiagramEx.NeutralCourt,
    data: ["sampleFrame"],
    Aside: () => <ScoreTable discs={sampleFrame} />,
    asideLabel: "Scores",
    courtWidth: COURT_WIDTH,
    slugs: ["Diagram"],
    gallery: true,
  },
  {
    id: "CoordinatePlot",
    file: "diagram.examples.tsx",
    title: "Coordinate system",
    description:
      "Seven discs tracing the centerline (x=36) from the near baseline (y=0) to the far baseline (y=468), confirming how the y-axis maps to court landmarks.",
    Visual: DiagramEx.CoordinatePlot,
    data: ["coordPlotDiscs"],
    Aside: DiagramEx.CoordinateLegend,
    asideLabel: "Landmarks",
    courtWidth: COURT_WIDTH,
    slugs: ["Diagram"],
    gallery: true,
  },
  {
    id: "ShooterShadows",
    file: "spatial.examples.tsx",
    title: "Shooter shadows",
    description:
      "With a shooter set and showShadows on, each disc casts a translucent shadow wedge from its tangent lines. Discs sitting in another's shadow darken — a lit-from-the-shooter effect.",
    Visual: Spatial.ShooterShadows,
    data: ["sampleFrame", "frameShooter"],
    Aside: () => <OcclusionTable shooter={frameShooter} discs={sampleFrame} />,
    asideLabel: "Occlusion",
    courtWidth: COURT_WIDTH,
    slugs: ["Diagram"],
    gallery: true,
  },
  {
    id: "Spotlight",
    file: "spatial.examples.tsx",
    title: "Inverted spotlight",
    description:
      "showSpotlight dims the whole court and cuts a cone of visibility from the shooter to the back baseline. Blocker shadows re-dim the cone where line of sight breaks.",
    Visual: Spatial.Spotlight,
    data: ["sampleFrame", "frameShooter"],
    Aside: () => <OcclusionTable shooter={frameShooter} discs={sampleFrame} />,
    asideLabel: "Occlusion",
    courtWidth: COURT_WIDTH,
    slugs: ["Diagram"],
    gallery: true,
  },
];

export const galleryExamples = EXAMPLES.filter((e) => e.gallery);

/**
 * Examples rendered inline beneath an API entry. Gallery examples are excluded
 * — they live in the Court gallery instead, so they aren't duplicated under
 * the Diagram entry they're attached to.
 */
export function examplesForSlug(slug: string): ExampleMeta[] {
  return EXAMPLES.filter((e) => !e.gallery && e.slugs.includes(slug));
}
