# Shuffleboard Rules — Schema & Rendering Reference

A condensed reference to the rules of outdoor/court shuffleboard, scoped to what
this project needs for schema, rendering, and scoring logic. **Not** a complete
rulebook — penalties, code of conduct, tournament administration, etc. are
intentionally omitted.

Authoritative source: [ILSA Rules of Play v1.3, ratified May 6, 2026](https://www.illinoisshuffleboard.org/documents/ILSA%20-%20Rules%20of%20Play%20-%201.3.pdf).
When this doc and ILSA disagree, ILSA wins.

---

## Court Geometry

Total playing surface: **39 ft × 6 ft** (468 in × 72 in). Margins (2 ft sides,
6 ft 6 in standoffs) exist but are not part of the played surface.

The court is **symmetric** along both axes. Each end mirrors the other.

### Each end's zones (from the back baseline forward, toward the dead zone)

| Zone | Depth | Notes |
|---|---|---|
| **10-off / Kitchen** | 18 in (1' 6") | Aliases: "starting area", "kitchen". Doubles as the shooting-end origin (where discs are staged) and the target-end -10 zone. **Trapezoidal**: full 72-inch width at the back baseline, narrowing to 60 inches at the kitchen / 7 boundary. Side edges share the scoring triangle's slope (1 in/3 in). Contains a decorative **separator triangle** dividing it into yellow-side / black-side for shooting; the separator has no scoring meaning at the target end. |
| **7 zone** (×2) | 36 in (3 ft) | Wide base of the scoring triangle, 6 ft wide. Left and right halves separated by the **centerline**. |
| **8 zone** (×2) | 36 in (3 ft) | Left and right halves. |
| **10 zone** | 36 in (3 ft) | Apex of the scoring triangle. Single zone (no left/right split). |
| **Apex-to-lag-line buffer** | 36 in (3 ft) | Past the apex of the 10, before the lag line. Discs landing here are alive (past the apex of the 10 from the back baseline) but in no scoring zone. |

Scoring triangle = 7 + 8 + 10 = **9 ft (108 in)** long. Per end: kitchen + scoring triangle + buffer = 18 + 108 + 36 = **162 in** to the lag line.

### Middle

The **dead zone** between the two lag lines is **144 in (12 ft)** wide.

End-to-end: 162 + 144 + 162 = **468 in (39 ft)** ✓

### Key lines (ILSA terminology)

| Term | Where |
|---|---|
| **Baseline** | Back edge of the kitchen / front of the standing area. Marks where players stand to shoot. |
| **Apex** | The point at the front of the 10 zone (closest to the dead zone). The most-named landmark in the game. |
| **Separator lines** | Internal lines dividing scoring zones (10/8, 8/7, 7/kitchen). |
| **Centerline** | Longitudinal middle, divides the court into yellow side / black side. Per the old SVG, only painted through the 7 and 8 zones (not the 10 or the kitchen). |
| **Lag line** | A transverse line discs must touch or pass to remain live. 3 ft past the apex of the 10 (`y = 162` in half-court coords; apex at `y = 126`). |
| **Side lines** | The two long edges of the playing surface. |

**Line width**: 1 inch (typical painted court marking). The "touching a line"
scoring rule (1.3.1) interprets a disc as touching a line if its bounding
circle overlaps the 1-inch-wide painted region.

---

## Equipment

- **Discs** (a.k.a. "biscuits", per glossary): 6 in diameter, 9/16"–1" thick,
  ≥ 11.5 oz. A set is 8 discs: 4 yellow, 4 black.
- **Cue** (a.k.a. "tang"): max 6'3" long. Used to propel discs. Not rendered.

---

## Frame Structure

A **frame** = each player shoots 4 discs from a single end of the court,
alternating colors. **8 shots total per frame.** This is universal across
formats.

### Frame end

A frame is complete when **the 8th disc is shot and all discs come to a stop**.
At this point, all live discs on the target end's scoring area are scored.

### Lead order varies by format/region

Within a frame, colors alternate strictly (Y, B, Y, B, … or B, Y, B, Y, …),
but **which color leads each frame is format-dependent.** ILSA's convention is
`[Y, B, B, Y]` repeating; other associations and casual play use different
patterns. Hammer is always the opposite color of the lead — that part is
universal.

Treat the lead pattern as **per-format configuration**, not a constant. Schema
should not hard-code it; iconography (e.g., a "Yellow Out" indicator on a frame
marker) must read from the format/match metadata.

---

## Scoring

### Scoring zones

| Zone | Value |
|---|---|
| 10 | +10 |
| 8 (either side) | +8 |
| 7 (either side) | +7 |
| 10-off / Kitchen | −10 |

Scoring discs do **not** cancel each other out: if both players have a disc in
an 8 zone, both get +8.

### Boundary rules (ILSA 1.3.1)

- A disc scores its zone's value **only if it is fully within the zone's lines,
  not touching them.**
- The decorative separator triangle inside the kitchen is **not** a line for
  scoring purposes — a disc touching it still counts as −10.
- A disc **touching an interior line** (between scoring zones) does not score.
- A disc **straddling the centerline** does not score.
- A disc **touching the interior line at the back of the kitchen** does not
  score.
- A disc **fully past the back baseline** (not touching any line) is dead and
  removed.

### Stacked discs

A disc resting on top of another disc ("mounted") counts if it is within the
scoring area. Each disc is judged separately.

---

## Dead Discs

A disc becomes **dead** (and is removed from play) if any of:

- It leaves the court beyond the far baseline.
- It goes off the side of the court.
- It returns to the playing area after striking something outside the court.
- It stops in front of the **far lag line** without touching it (i.e., short
  shot that didn't reach the target end).
- It leans over the edge of the court and touches the alley.

### Lag line position

The lag line is **3 ft (36 in) past the apex of the 10**, per the ILSA court
diagram. In half-court coords (apex at `y = 126`): **`y = 162`**. The 12 ft
middle dead zone runs between the two lag lines (one at each end of the court).

A disc that comes to rest short of the lag line (between the lag line and the
shooter) without touching it is dead (rule 2.6.1). A disc touching or past the
lag line is live and may score if also inside a scoring zone (kitchen / 7 / 8 /
10). Discs in the apex-to-lag-line buffer (`y ∈ [126, 162]`) are alive but
in no scoring zone.

### Schema note (deferred until replay UI)

V1 schemas store live disc positions per Shot. Dead-disc semantics
(rebounds, removed-discs tracking, ghosted previously-live discs in replays)
are deferred until the replay UI is built.

---

## Match Structure (brief; varies by format)

Match-level rules vary across associations, regions, and casual play. ILSA's
v1.3 conventions are described below as a **reference**, not a universal.

- Two **game types** (ILSA):
  - **Points game** — first to a threshold (75 in ILSA; varies elsewhere). Must
    complete the frame.
  - **Frames game** — fixed number of frames (must be even in ILSA; 8/12/16
    are common across formats); highest total wins.
- Three **player configurations** (broadly universal in name; specifics vary):
  - **Walking singles** — 1v1; players walk to the other end each frame.
    ILSA: odd frames from head, even from foot.
  - **Non-walking singles** — 1v1; both shoot from the same end the whole match.
    Another match may share the other end of the court.
  - **Doubles** — 2v2; one player from each team on each end.
- ILSA: yellow plays from the right side at the head and the left side at the
  foot. Side conventions may differ in other formats.

This affects physical end orientation but **not** Diagram rendering — a Diagram
is always the target end in canonical orientation. It **does** affect
iconography we'll layer on later (frame markers, match-progress UI,
"who's-Out-this-frame" indicators).

---

## Glossary (selected, ILSA-aligned)

| Term | Meaning |
|---|---|
| **Apex** | Point at the top of the 10 scoring area. |
| **Baseline** | Line separating the 10-off area from the standing area (back of kitchen). |
| **Biscuit** | Synonym for disc. |
| **Cue** | Equipment used to propel discs. Also "tang". |
| **Dead disc** | A disc that has been shot but is out of play (see Dead Discs). |
| **End** | One of the two short sides of the court. "Head" (with scoreboard) or "Foot". |
| **Frame** | One round of 8 shots, alternating colors. |
| **Hammer** | The last disc shot in a frame. |
| **Kitchen** | The 10-off area. Also "starting area". |
| **Lag line** | Must-touch-or-pass line for a disc to remain live. |
| **Live disc** | A disc shot but not dead — still in play. |
| **Out** | The color/player that shoots first in a frame. Opposite of hammer. |
| **Scoring area** | The triangle players aim for. Also "shufflegram". |
| **Side** | Yellow side or black side of the court (each color's starting half). Only meaningful at the shooting end. |

---

## Open Questions

None blocking v1. (Lag line at `y = 162` (3 ft past the apex), lines 1" wide,
dead-disc model deferred to replay UI.)

---

## What's universal vs. what varies by format

The Diagram primitive (and its data schema) should depend **only** on the
universal rules. Variable rules should live in match/format metadata that the
Diagram knows nothing about.

### Universal (safe to encode in the core schema)

- Court geometry: 39 ft × 6 ft playing surface; 10-off/kitchen 18 in deep;
  scoring triangle 12 ft × 6 ft (base) with 10/8/7 zones; 12 ft dead zone in
  middle.
- Disc dimensions: 6 in diameter.
- Scoring zone values: +10, +8, +7, −10.
- Per-zone scoring rule: disc must be fully within the zone's lines, not
  touching them, to score (kitchen separator triangle is not a scoring line).
- A frame = 8 shots, alternating colors.
- Hammer = last shot of a frame. Out = first shot.
- Stacked discs are judged separately.
- Dead-disc conditions (off side, off back, short of far lag line, etc.).

### Format/region-dependent (do NOT hard-code in the core schema)

- **Frame count** per game (8, 12, 16, etc.).
- **Points threshold** for points games (75 in ILSA; varies).
- **Lead pattern** per frame (ILSA's `[Y, B, B, Y]` is one of several).
- **Side-switching cadence** within and across games of a match.
- **Color-change rules** across games of a multi-game match.
- **Walking vs. non-walking conventions** and odd/even frame end assignments.
- Yellow/black side assignment at head vs. foot.

These belong in a separate `Format` (or `Ruleset`) configuration type that
match-level iconography reads from. The Diagram and Sequence primitives are
unaffected.

## Coordinate System

A **half-court Diagram is exactly half the playing surface**, so two of them
mirrored across their high-y edge tile into a full court.

The coordinate system matches the canonical SVG (`court.svg`): vertical
orientation with the back baseline at the top.

- **Origin**: top-left corner of the depicted end (back baseline meets the
  left side line).
- **x**: 0 at the left side line, 72 at the right side line. Centerline at
  `x = 36`.
- **y**: 0 at the back baseline, increasing forward toward the centerline of
  the full court (which sits at the boundary between the two half-courts).
- **Units**: inches. Decimals allowed.

### Half-court extent

- `x ∈ [0, 72]` — full 72-inch width.
- `y ∈ [0, 234]` — half the 468-inch playing surface.

### Zones in these coordinates

Reading from the back baseline forward (low y to high y):

| Zone | y range | x boundary |
|---|---|---|
| 10-off / Kitchen | [0, 18] | trapezoidal: full width at `y = 0` (x ∈ [0, 72]), narrowing to x ∈ [6, 66] at `y = 18`. Side edges share the triangle slope (`dx/dy = 1/3`). |
| 7 zone, left | [18, 54] | x ∈ [(y − 18) / 3, 36] |
| 7 zone, right | [18, 54] | x ∈ [36, 72 − (y − 18) / 3] |
| 8 zone, left | [54, 90] | x ∈ [(y − 18) / 3, 36] |
| 8 zone, right | [54, 90] | x ∈ [36, 72 − (y − 18) / 3] |
| 10 zone | [90, 126] | x ∈ [(y − 18) / 3, 72 − (y − 18) / 3] (single zone) |
| Apex of the 10 | (36, 126) | single point |
| Apex-to-lag-line buffer | [126, 162] | full width: x ∈ [0, 72] — alive but unscoreable |
| Lag line | y = 162 | the threshold for liveness (rule 2.6.1) |
| Dead zone (this side, short of lag line) | (162, 234] | full width — dead per rule 2.6.1 |

The scoring triangle's outer edges are straight lines from the back corners of
the 7 zone to the apex:

- Left: `x = (y − 18) / 3` for `y ∈ [18, 126]` — from `(0, 18)` to `(36, 126)`.
- Right: `x = 72 − (y − 18) / 3` for `y ∈ [18, 126]` — from `(72, 18)` to
  `(36, 126)`.

Discs come from the opposite end (off-canvas, beyond `y = 234`) and travel
toward decreasing y. A disc fully past the back baseline (`y < 0`) has left
the court.

### Full-court composition

A full court is two half-courts placed back-to-back along the high-y edge.
Mirror the second half across `y = 234`:

- Half A: `y ∈ [0, 234]` as defined above.
- Half B: `y ∈ [234, 468]`, with internal zone math mirrored
  (B-end kitchen is `y ∈ [450, 468]`, B-end apex at `(36, 342)`, B-end lag
  line at `y = 306`).

A full-court rendering is a composition of two Diagrams, not a separate type.

## Implications for Schema (informational, not normative)

- A **Diagram** is canonically the **target end** — the shooting end is never
  rendered.
- Origin is the **top-left corner of the depicted end** — back baseline meets
  the left side line, matching the SVG (see Coordinate System above).
- **Yellow/black "sides" do not apply to a Diagram** — they're a shooting-end
  concept. Discs carry a `color`; the Diagram does not carry a "side."
- A **Sequence** of Shots within a frame is 8 entries. Cross-frame Sequences
  must handle the "clear the court between frames" implicit reset.
- "Hammer" is **always the last shot of a frame** (universal). Lead pattern is
  format-dependent (see above).
- Disc identity is **stable across a Sequence** — disc `y1` thrown in shot 1
  may be displaced in shot 3, but it's the same disc.
- A match-level `Format` (or `Ruleset`) configuration carries frame count,
  lead pattern, points threshold, side conventions, etc. Iconography reads
  from this; the Diagram primitive does not.
