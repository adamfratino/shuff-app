import type { ComponentType } from "react";

import { COURT_WIDTH, OcclusionTable, ScoreTable } from "./_shared";
import {
  cornerDiscs,
  frameShooter,
  occlusionDiscs,
  occlusionShooter,
  sampleFrame,
  thresholdDiscs,
} from "./data";
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
  /** The court visual, rendered in the fixed-width left column. */
  Visual: ComponentType;
  /** Optional data view (score/occlusion table), rendered in the details column. */
  Aside?: ComponentType;
  /** Section header shown above the Aside table (defaults to "Result"). */
  asideLabel?: string;
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
    id: "SampleFrame",
    file: "scoring.examples.tsx",
    title: "A scored frame",
    description:
      "Eight discs, four per color. frameScore sums each color; scoringZone and score resolve each disc's zone and points. 7-left and 8-right hold two discs each, so their zone fills tint more heavily.",
    Visual: Scoring.SampleFrame,
    Aside: () => <ScoreTable discs={sampleFrame} />,
    asideLabel: "Scores",
    courtWidth: COURT_WIDTH,
    slugs: ["frameScore", "score", "scoringZone"],
  },
  {
    id: "ThresholdCases",
    file: "scoring.examples.tsx",
    title: "Clearance threshold",
    description:
      'A disc must clear a scoring line by SCORING_CLEARANCE (3.5") to count. Only the disc just past the 8/10 line scores — the one just short, the one straddling the centerline, and the one in the buffer all read as no score.',
    Visual: Scoring.ThresholdCases,
    Aside: () => <ScoreTable discs={thresholdDiscs} />,
    asideLabel: "Scores",
    courtWidth: COURT_WIDTH,
    slugs: ["SCORING_CLEARANCE", "scoreValue", "isScoringZone"],
  },
  {
    id: "CornerDiscs",
    file: "scoring.examples.tsx",
    title: "Every scoring corner",
    description:
      "One disc tucked into each corner of every scoring area, just inside the clearance from both intersecting lines. A stress test that every zone resolves and tints independently.",
    Visual: Scoring.CornerDiscs,
    Aside: () => <ScoreTable discs={cornerDiscs} />,
    asideLabel: "Scores",
    courtWidth: COURT_WIDTH,
    slugs: ["zoneAt", "activeScoringZones"],
  },
  {
    id: "HalfCourt",
    file: "diagram.examples.tsx",
    title: "Half court (default)",
    description:
      "The default variant renders the target end only — back baseline at top, apex toward the centerline. viewBox 0 0 72 234.",
    Visual: DiagramEx.HalfCourt,
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
    Aside: () => <ScoreTable discs={sampleFrame} />,
    asideLabel: "Scores",
    courtWidth: COURT_WIDTH,
    slugs: ["Diagram"],
    gallery: true,
  },
  {
    id: "FullCourt",
    file: "diagram.examples.tsx",
    title: "Full court",
    description:
      'variant="full" renders both ends; the far end mirrors the near end across y = 234. viewBox 0 0 72 468.',
    Visual: DiagramEx.FullCourt,
    Aside: () => <ScoreTable discs={sampleFrame} />,
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
    Aside: DiagramEx.CoordinateLegend,
    asideLabel: "Landmarks",
    courtWidth: COURT_WIDTH,
    slugs: ["Diagram"],
    gallery: true,
  },
  {
    id: "MirrorTransforms",
    file: "mirror.examples.tsx",
    title: "Mirror transforms",
    description:
      "Toggle mirrorEnd to flip the frame across the full-court center (y = 234, sending discs to the far end) and mirrorSide to flip across the longitudinal centerline (x = 36). Both preserve disc color and chain freely; once mirrored to the far end the discs fall outside the half-court scoring grid and total 0.",
    Visual: Mirror.MirrorTransforms,
    courtWidth: COURT_WIDTH,
    custom: true,
    slugs: ["mirrorEnd", "mirrorSide"],
  },
  {
    id: "ShooterShadows",
    file: "spatial.examples.tsx",
    title: "Shooter shadows",
    description:
      "With a shooter set and showShadows on, each disc casts a translucent shadow wedge from its tangent lines. Discs sitting in another's shadow darken — a lit-from-the-shooter effect.",
    Visual: Spatial.ShooterShadows,
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
    Aside: () => <OcclusionTable shooter={frameShooter} discs={sampleFrame} />,
    asideLabel: "Occlusion",
    courtWidth: COURT_WIDTH,
    slugs: ["shadowPolygon"],
  },
  {
    id: "Occlusion",
    file: "spatial.examples.tsx",
    title: "Occlusion breakdown",
    description:
      "Shooter at (15, 459). occlusion reports what fraction of each disc is hidden and which discs block it: full occlusion (yellow blocks black at x=15), partial (~half), a multi-blocker chain (unioned), and an off-line reference that reports 0%.",
    Visual: Spatial.Occlusion,
    Aside: () => (
      <OcclusionTable shooter={occlusionShooter} discs={occlusionDiscs} />
    ),
    asideLabel: "Occlusion",
    courtWidth: COURT_WIDTH,
    slugs: ["occlusion", "findBlockers", "isOccluded"],
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
