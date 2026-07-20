# @shuff/motion — Animation Strategy

Status: **proposal / pre-implementation**. Nothing in this package exists yet.
This document is the plan for adding an animation layer on top of
[`@shuff/diagram`](../diagram) using [Motion](https://motion.dev) (the library
formerly known as Framer Motion).

---

## 1. Why a separate package

The workspace already has a clean layering story:

| Package | Question it answers | Knows about |
|---|---|---|
| `@shuff/core` | **Where is everything?** (geometry, zones, scoring, occlusion) | inches, math |
| `@shuff/diagram` | **What does it look like?** (SVG rendering of one board state) | React, SVG |
| `@shuff/motion` (this plan) | **How did it change over time?** (shots, replays, transitions) | React, Motion, time |

`@shuff/motion` sits strictly *above* diagram: it orchestrates sequences of
board states and feeds them to the existing renderer. It should never
re-implement court geometry or scoring — that stays in core — and ideally it
should not re-implement disc rendering either (see §4).

## 2. What we want to animate (use cases, in priority order)

1. **State-to-state transition** — the board shows one arrangement of discs,
   the data changes, and discs glide (with a physical, weighty settle) to
   their new positions instead of teleporting. This is the atomic building
   block; everything else composes it.
2. **Shot replay** — a disc leaves the kitchen at the shooting end, travels
   down the court, and comes to rest — possibly striking other discs, which
   then move (or leave the court entirely). Chained per frame: 8 shots,
   alternating colors, replayed as a story.
3. **Live scoring feedback** — as a disc slides through zones, the
   `highlightScoring` tints and zone labels update mid-flight. (This falls
   out for free with the recommended architecture — see §4.)
4. **Presentation flourishes** — court line draw-in (`pathLength`), disc
   enter/exit (a disc knocked past the side line fades/slides off), staggered
   setup of a diagram in the docs, spotlight/shadow transitions when the
   shooter moves.
5. **Playback control** — play/pause/scrub/speed for replays; eventually
   scroll-linked scrubbing for editorial content.

Explicit non-goals for v1: real physics simulation (friction, spin,
momentum transfer), multi-court sync, video export.

## 3. Motion in 60 seconds (what we're buying)

Motion ships three API surfaces we care about:

- **`motion/react` components** — `<motion.circle animate={{ cx, cy }} />`.
  Declarative, does FLIP/layout animations, `AnimatePresence` for exit
  animations, springs with velocity carry-over (interruptible animations
  stay smooth).
- **The hybrid `animate()` function + `useAnimate()` hook** — imperative
  timelines expressed as plain arrays:
  ```ts
  animate([
    [shotDisc, { cx: 36, cy: 108 }, { duration: 0.9, ease: "circOut" }],
    [struckDisc, { cx: 48, cy: 90 }, { at: "-0.15", type: "spring" }],
  ])
  ```
  Sequences can mix DOM elements and raw motion values, support relative
  offsets (`at`), stagger, and return playback controls
  (`.pause()`, `.time`, `.speed`) — exactly the shape of a shot replay.
- **Motion values** (`motionValue`, `useTransform`) — reactive numbers that
  update outside the React render loop and can be piped straight into SVG
  attributes.

Also relevant: `useReducedMotion` / `<MotionConfig reducedMotion="user">` for
accessibility, and SVG specials (`pathLength`, `pathOffset`) for line-drawing
effects. Bundle note: the full `motion/react` entry is ~18 kB gzipped;
`motion/mini` (~2.5 kB) is WAAPI-only and **not** sufficient for springs,
sequences, or React components — we need the full build, as a peer dep so
apps bundle it once.

## 4. The central architectural decision: animate the *data* or the *DOM*?

Two viable integration strategies; this choice shapes everything.

### Option A — animate the data (recommended for v1)

Motion drives **numbers, not elements**. A headless hook interpolates between
board states and hands `@shuff/diagram` a plain `Disc[]` every animation
frame. Diagram stays 100 % unaware of animation.

```
target Disc[] ──▶ useBoardTransition() ──▶ in-flight Disc[] ──▶ <Diagram discs={...}/>
                    (Motion springs on             │
                     per-disc motion values)       └── re-render per frame
```

**Pros**
- **Zero changes to `@shuff/diagram`** to get started. The motion package is
  purely additive.
- Everything *derived* from disc position stays correct mid-flight
  automatically: zone tints, `--shuff-zone-count`, labels, shadow polygons,
  the spotlight mask. A disc sliding through the 8 lights the 8 up as it
  passes. This is use case 3 for free, and it is the kind of correctness
  that a DOM-only approach would have to re-derive.
- The interpolated `Disc[]` is inspectable data — trivially testable
  (assert positions at t=0.5), loggable, and portable to any future renderer
  (canvas, native).

**Cons**
- One React re-render of the SVG per animation frame. For a shuffleboard
  board this is bounded and small: ≤ 8 discs, a handful of polygons.
  `activeScoringZones` and `shadowPolygon` run per frame — both are cheap
  closed-form math over ≤ 8 discs. Needs a benchmark in the spike (§7
  Phase 0), but expected fine even on mobile.

### Option B — animate the DOM (the escape hatch)

Discs render as `<motion.circle>` and Motion writes `cx`/`cy` directly,
bypassing React renders entirely. Requires `@shuff/diagram` to grow a slot —
e.g. a `renderDisc?: (disc, index) => ReactNode` prop or exported court
primitives — so the motion package can inject animated elements into the
correct z-order.

**Pros:** no per-frame React work; `AnimatePresence`/layout animations apply
directly. **Cons:** diagram API change; derived visuals (zone tints, shadows,
labels) no longer update mid-flight unless separately driven; two sources of
truth for disc position.

### Decision

**Start with Option A.** Design the public API (§6) so consumers never know
which strategy is underneath — hooks take and return `Disc[]`/board states,
components take the same props as `Diagram`. If profiling shows the re-render
cost matters on target devices, Option B becomes an internal optimization
behind the same API, gated on a small `renderDisc` addition to diagram.

## 5. Schema: identity, states, shots

### 5.1 Disc identity (prerequisite)

Animation requires knowing that *this* disc in state N is *that* disc in
state N+1. Today `Disc` is `{ x, y, color }` and `Diagram` keys by array
index — index keying will visibly glitch the moment a disc is removed
mid-list (every later disc "becomes" its neighbor).

Plan:
- `@shuff/motion` defines `TrackedDisc = Disc & { id: string }` and requires
  ids at its boundary.
- Upstream an **optional** `id?: string` onto `Disc` in `@shuff/core`
  (non-breaking) and have `Diagram` prefer `disc.id ?? index` for React keys.

**This already exists**: [PR #1](https://github.com/adamfratino/shuff-app/pull/1)
commit `5d1e542` adds exactly this — optional `Disc.id` in core plus id-based
keys on every disc-derived list in `Diagram` (discs, labels, projections,
shadows, spotlight mask). The PR as a whole is stale/conflicting (it bundles
Biome + CI work that predates the docs restructure), but main hasn't touched
`packages/core` or `packages/diagram` since it branched, so the disc-id
commit cherry-picks cleanly onto a fresh branch. Extracting it is the
Phase 1 prerequisite; the Biome/CI rehab can proceed independently.

### 5.2 Board states and shots (domain vocabulary, per `docs/RULES.md`)

Model animation in shuffleboard terms, not tween terms:

```ts
type BoardState = TrackedDisc[];            // discs at rest ("all discs come to a stop")

type ShotOutcome = {
  discId: string;                            // the shot disc
  from: Point;                               // release point (kitchen, shooting end)
  path?: Point[];                            // optional waypoints; straight line if omitted
  rest: Point | "off-court" | "removed";     // where it settles (kitchen'd discs get removed)
  moves?: DiscMove[];                        // knock-on movement of struck discs
};

type DiscMove = {
  discId: string;
  rest: Point | "off-court";
  contactAt?: number;                        // 0–1 progress along the shot when struck
};

type Shot = { color: "yellow" | "black"; outcome: ShotOutcome };
type Sequence = { shots: Shot[]; initial: BoardState };  // 8 shots per frame
```

`Sequence` is the term `docs/RULES.md` already uses for the ordered shots of
a frame ("A Sequence of Shots within a frame is 8 entries"), including the
note that disc identity is stable across a Sequence — which is exactly the
identity requirement in §5.1. Cross-frame playback (the implicit
clear-the-court reset between frames) is a later composition concern.

Directionality, per RULES.md: shot discs enter from the shooting end (beyond
`y = 234` in half-court coords) traveling toward **decreasing y**; a disc
past the back baseline (`y < 0`) has left the court.

Key modeling choice: we describe **outcomes with timing hints**, not physics.
`contactAt` says *when* a struck disc starts moving; the renderer maps that
onto a Motion sequence `at` offset. Authoring stays simple (a replay can be
hand-written or derived from before/after states), and `@shuff/core`'s
`discsTouching` / geometry can later *infer* plausible `contactAt` values and
deflection paths (Phase 3).

## 6. Public API sketch

Headless-first, mirroring how core/diagram split math from rendering:

```ts
// hooks (the real product)
useBoardTransition(target: BoardState, options?): TrackedDisc[]
  // returns in-flight positions; springs per disc; interruptible
useShotReplay(sequence: Sequence, options?): {
  discs: TrackedDisc[];                      // current in-flight positions
  controls: { play; pause; seek(t); speed; shotIndex };
}

// components — dropped (2026-07). The package stays headless: consumers
// render <Diagram discs={inFlight}/> themselves. AnimatedDiagram shipped in
// Phase 1 and was removed once the docs settled on the hook; if a wrapper
// ever proves necessary it belongs in @shuff/diagram, not here.

// presets & config
easings: { travel, settle, knock }           // a cued 11.5 oz disc: gentle
                                             // ramp-up through the stroke, long
                                             // friction glide — no bounce or
                                             // overshoot
<ShuffMotionConfig reducedMotion="user">     // wraps MotionConfig; snap-to-final fallback

// types
TrackedDisc, BoardState, Shot, ShotOutcome, DiscMove, Sequence
```

**Feel note — this is floor shuffleboard, not tabletop.** Discs are pushed
with a cue down a hard court (concrete or similar) and decelerate under
friction to a stop. There is no springiness in the real motion: the correct
default for a traveling disc is a gentle ramp-up as the cue accelerates it
through the stroke, then a friction-style ease-out (long decaying glide) —
not an instant launch, and not a spring with overshoot. Motion's springs remain useful
for their *interruptibility* (velocity carry-over when retargeting
mid-flight) — configured critically damped so they never oscillate.

**Reference physics**: [shuffleboardjam.com](https://shuffleboardjam.com/)
(a playable floor-shuffleboard sim in the same inch-based coordinates) uses
Coulomb friction — constant deceleration `μ = 160 in/s²`, so stopping
distance is `v²/2μ` (quadratic in speed) — launch speed `v0 = √(2μd)` chosen
to stop at the aim point, and **perfectly elastic equal-mass collisions**
(full exchange of the normal component of relative velocity). Constant
deceleration is exactly a quadratic ease-out, so this maps 1:1 onto Motion
segments with analytic velocities. The Phase 0 spike ports this model.

Some courts are dressed with **beads** (silicone/glass) that make the surface
faster; many aren't. Court speed is therefore variable in real play. Not MVP,
but the presets should be parameterized from day one by a single
`courtSpeed` scalar (affecting glide duration/deceleration curves) so a
speed control can be added later without reworking every animation.

Design rules:
- The package ships no components — hooks own all Motion usage and
  consumers render `<Diagram>` themselves.
- Reduced motion is honored by default: transitions become near-instant,
  replays step between rest states.

## 7. Package setup

Mirror `@shuff/diagram` exactly:

- `packages/motion/` with `tsup` (ESM + CJS + d.ts), `tsconfig` extending
  `tsconfig.base.json`, turbo `build`/`dev`/`typecheck` tasks.
- `package.json` name `@shuff/motion`; **peer** deps: `react >= 18`,
  `motion ^12`, `@shuff/core workspace:*`, `@shuff/diagram workspace:*`.
- Hooks/components need `"use client"` where applicable (Motion components
  are client-only); tsup banner or per-file directive.
- Vitest for the interpolation/schema logic (the headless parts are plain
  functions — test positions at given progress values, sequence offset
  math, reduced-motion fallbacks).

## 8. Phased roadmap

**Phase 0 — spike (throwaway, in the docs app).**
Animate a single disc between two positions via Option A: a motion value per
axis, spring transition, `Diagram` re-rendering per frame. Verify: smoothness
on a throttled CPU, live zone-tint updates, interrupt behavior (retarget
mid-flight). This validates the §4 decision with ~50 lines.

**Phase 1 — `useBoardTransition`.**
Disc identity model (`TrackedDisc`, id-diffing: moved / added / removed),
friction-feel easing presets (parameterized by `courtSpeed`), reduced-motion
support, tests. Upstream PR: optional `id` on
`Disc` + key fix in `Diagram`.

**Phase 2 — shot replay.**
`Shot`/`Sequence` schema, `useShotReplay` built on Motion sequences
(`at` offsets from `contactAt`), playback controls, `AnimatePresence`-style
exit for off-court/kitchen'd discs. Docs page with a hand-authored 8-shot
frame and a minimal transport UI (built in the docs, not the package).

**Phase 3 — derived realism + polish.**
Use `@shuff/core` geometry to infer contact timing and deflection paths from
before/after states (so a replay can be authored as just a list of rest
positions), court line draw-in (`pathLength`), staggered mount animation,
shooter/spotlight transitions.

**Phase 4 — optional futures.**
Scroll-linked scrubbing, Option B DOM-animation optimization behind the same
API (adds `renderDisc` slot to diagram), animation export, editor tooling.

## 9. Risks & open questions

- **Per-frame re-render cost** (Option A's bet). Mitigation: Phase 0
  benchmark; escape hatch is Option B behind an unchanged API.
- **Disc identity upstreaming** — solved in principle by PR #1's `5d1e542`
  (see §5.1); just needs extraction from that stale PR.
- **Mid-flight scoring semantics** — should zone tints update live during a
  replay or only at rest (as real scoring does — "when all discs come to a
  stop")? Proposal: live by default, `scoreAtRest` opt-out. Needs a call.
- **Full-court replays** — shots travel shooting end → target end, so replay
  rendering wants `variant="full"` and mirrored coordinates (`mirrorEnd` in
  core). Half-court replays can clip entry at the lag line. Defer details to
  Phase 2.
- **Motion versioning** — Motion (v12+) is the continuation of Framer
  Motion; import from `motion/react`. Pin as peer `^12`.
