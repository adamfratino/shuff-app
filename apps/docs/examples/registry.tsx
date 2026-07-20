import type { ComponentType, ReactNode } from "react";

import { COURT_WIDTH, OcclusionTable, ScoreTable } from "./_shared";
import { cornerDiscs, frameShooter, sampleFrame } from "./data";
import * as Scoring from "./scoring.examples";
import * as DiagramEx from "./diagram.examples";
import * as Spatial from "./spatial.examples";
import * as Mirror from "./mirror.examples";
import * as Motion from "./motion.examples";
import * as Strategy from "./strategy.examples";

export type ExampleMeta = {
  /** Stable id, also used as the source-code export name. */
  id: string;
  /**
   * Path (relative to the examples dir) of a self-contained snippet file
   * displayed whole — imports and all — instead of slicing `id`'s source.
   * Decouples the shown code from the rendered demo: the snippet is a real
   * module the app typechecks (it can't rot), and the interactive fluff
   * stays in the Visual, out of the code block.
   */
  snippet?: string;
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

/**
 * Examples for the /motion page — the planned @shuff/motion animation layer
 * (see packages/motion/PLAN.md). Kept out of EXAMPLES so they don't surface
 * in the /diagram gallery or under API entries.
 */
export const MOTION_EXAMPLES: ExampleMeta[] = [
  {
    id: "UseWithDiagram",
    snippet: "snippets/basic-transition.tsx",
    file: "motion.examples.tsx",
    title: "How to use with Diagram",
    description:
      "The whole integration recipe: keep your board as plain data, pass it through useBoardTransition, and hand the result to an untouched <Diagram>. The hook returns in-flight TrackedDisc[] each frame — no wrapper component, no animation code in yours — so anything derived from position (zone tints, labels, shadows) stays correct mid-glide.",
    Visual: Motion.UseWithDiagram,
    courtWidth: COURT_WIDTH,
    custom: true,
    slugs: [],
  },
  {
    id: "Collisions",
    snippet: "snippets/collision.tsx",
    file: "motion.examples.tsx",
    title: "Collisions",
    description:
      "Collision outcomes are one function call: @shuff/strategy's simulateShot plays a shot through the Jam model — elastic equal-mass contact, chained knock-ons, dead discs removed — and returns the settled board for setBoard, the previous example unchanged.",
    Visual: Motion.Collisions,
    data: ["collisionBoard", "caromBoard", "breakRack"],
    courtWidth: COURT_WIDTH,
    custom: true,
    slugs: [],
  },
  {
    id: "Drift",
    snippet: "snippets/drift.tsx",
    file: "motion.examples.tsx",
    title: "Drift",
    description:
      "Outdoor courts aren't level — the reference sim's signature feature. Drift adds a constant downhill acceleration to the friction glide; because friction fights the disc's actual velocity, the bias tells as it slows, so the disc runs true at speed and hooks off the low side at the end. This is a docs spike — not yet in @shuff/motion — so the shot is integrated per frame rather than played as one analytic glide.",
    Visual: Motion.Drift,
    courtWidth: COURT_WIDTH,
    custom: true,
    slugs: [],
  },
];

/**
 * Examples for the /strategy page — @shuff/strategy played through the
 * motion physics engine. Framed for a shuffleboard player: one section per
 * named shot from docs/STRATEGY.md, each set up on a board where that shot
 * is the right play, plus the question behind every defensive choice.
 */
export const STRATEGY_EXAMPLES: ExampleMeta[] = [
  {
    id: "KitchenShot",
    file: "strategy.examples.tsx",
    title: "The kitchen shot",
    description:
      "Their 8 sits on an open line. The engine shoots straight through it into the 10-off: their +8 becomes −10 — an 18-point swing — and a clean stick-and-follow leaves the shooter scoring near where theirs stood.",
    Visual: Strategy.KitchenShot,
    data: ["kitchenShotBoard"],
    courtWidth: COURT_WIDTH,
    custom: true,
    slugs: [],
  },
  {
    id: "TheGuard",
    file: "strategy.examples.tsx",
    title: "The guard",
    description:
      "Your own 8 is naked on an open line — not 8 points of position but an 18-point liability. The engine parks a disc on the opponent's shooting line in front of it and the kitchen threat drops to zero. Here the guard even lands in the 8 itself.",
    Visual: Strategy.TheGuard,
    data: ["guardBoard"],
    courtWidth: COURT_WIDTH,
    custom: true,
    slugs: [],
  },
  {
    id: "TheSnuggle",
    file: "strategy.examples.tsx",
    title: "The snuggle",
    description:
      "Park your disc one diameter in front of their scorer. Any attack on yours now drives it into their own disc — your disc is protected by their material, and their bump line is gone.",
    Visual: Strategy.TheSnuggle,
    data: ["snuggleBoard"],
    courtWidth: COURT_WIDTH,
    custom: true,
    slugs: [],
  },
  {
    id: "KitchenReplace",
    file: "strategy.examples.tsx",
    title: "Kitchen replace",
    description:
      "You have a disc stuck at −10 and they have a scorer above it. The engine ghost-balls their disc into yours: yours is knocked out of the kitchen, theirs stays in it. One shot, a 20+ point swing.",
    Visual: Strategy.KitchenReplace,
    data: ["kitchenReplaceBoard"],
    courtWidth: COURT_WIDTH,
    custom: true,
    slugs: [],
  },
  {
    id: "TheSweep",
    file: "strategy.examples.tsx",
    title: "The sweep",
    description:
      "Two of their scorers share the 8 zone — that's not 16 points of position, it's one shot from being nothing. The engine punches through the nearest into the cluster's center of mass and takes them both.",
    Visual: Strategy.TheSweep,
    data: ["sweepBoard"],
    courtWidth: COURT_WIDTH,
    custom: true,
    slugs: [],
  },
  {
    id: "TheHammer",
    file: "strategy.examples.tsx",
    title: "The hammer",
    description:
      "Last shot of the frame: no reply is coming, so exposure means nothing and pure placement wins. The engine, so cautious mid-frame, aims dead at the 10.",
    Visual: Strategy.TheHammer,
    data: ["hammerBoard"],
    courtWidth: COURT_WIDTH,
    custom: true,
    slugs: [],
  },
  {
    id: "ExposureMeter",
    file: "strategy.examples.tsx",
    title: "Is this disc safe?",
    description:
      "The question behind every defensive shot. kitchenExposure reads the opponent's lines of sight geometrically: a scoring disc on an open kitchen line isn't points, it's a swing waiting to happen — and one guard on the line drops the risk to zero. Shadow wedges show the middle slot's view; the numbers aggregate all three.",
    Visual: Strategy.ExposureMeter,
    data: ["exposureScorer", "exposureGuard"],
    courtWidth: COURT_WIDTH,
    custom: true,
    slugs: [],
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
