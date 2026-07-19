# Shuffleboard Strategy — Shot Taxonomy & Decision Reference

A condensed reference to floor-shuffleboard strategy, scoped to what this
project needs: a **shared vocabulary of named shots** (for docs examples,
Sequence annotation, and iconography) and the **decision principles** behind
choosing them (for a future `@shuff/strategy` engine and CPU opponent).
**Not** a coaching manual.

Primary source: the CPU opponent in
[shuffleboardjam.com](https://shuffleboardjam.com/) (readable inline in the
page source), whose candidate-generation and evaluation logic encodes each
tactic below explicitly. Vocabulary aligned with [`RULES.md`](RULES.md) —
read that first; this doc assumes its coordinate system (inches, target end,
back baseline at `y = 0`, apex at `(36, 126)`).

---

## The Central Asymmetry: the Kitchen

Everything in shuffleboard strategy follows from one fact: **a disc in the
kitchen is worth −10**, and an opponent can *put your disc there*.

A disc of yours scoring `s` that gets knocked into the kitchen swings the
frame by **`s + 10`** — an exposed 8 is not "8 points at risk," it is an
**18-point swing** waiting to happen. By comparison, a disc merely cleared
off the court loses only its `s` points.

Consequences that shape the whole game:

- **Scoring is not enough.** A scoring disc that sits on an open shooting
  line is a liability, not an asset.
- **Defense means blocking lines, not moving discs.** A disc is safe when no
  line-of-sight from the opponent's shooting positions can drive it
  kitchen-ward. Guards create safety without touching the scorer.
- **The threat is worth more than the shot.** Much of good play is arranging
  discs so the opponent's best reply is still bad for them.

---

## Shot Taxonomy

Canonical shot names, in the order a player learns them. `label` is the
proposed schema token (see Schema Implications).

| Shot | `label` | What it is |
|---|---|---|
| **Score** | `score` | Plain placement into the 7 / 8 / 10 zones. The baseline shot; every other shot exists because this one creates or faces a threat. Avoid landing near the side lines (rail proximity limits later options and drifts dead easily). |
| **Kitchen shot** | `kitchen` | The signature attack: strike an opponent's disc so it travels on into the 10-off. Aimed either by **line extension** (shooter, target disc, and kitchen roughly collinear — shoot *through* the disc) or by **ghost ball** (see Aiming Geometry) when the kitchen lies off the direct line. |
| **Clear** | `clear` | Knock an opponent's scoring disc off the court (side or back). Removes `s` points without the kitchen bonus — the fallback when no kitchen line exists. |
| **Hard clear** | `hard-clear` | A clear at maximum weight. Sacrifices placement of the shooting disc (it usually follows off the court) for certainty of removal. |
| **Bump** | `bump` | Nudge your **own** disc that sits near a zone edge (or touching a line, scoring nothing) deeper into the zone. A soft ghost-ball shot toward the zone's interior. |
| **Guard / Block** | `block` | Place a disc on the opponent's shooting line **in front of your own scorer**, so it cannot be kitchened. The purest defensive shot; scores nothing itself but converts an 18-point liability into a safe `s`. |
| **Snuggle** | `snuggle` | Park your disc directly in front of an **opponent's** scorer (one disc-diameter short of it). Any attack on your disc now drives it into their own disc — your disc is protected by *their* material. Also blocks their bump line. |
| **Kitchen replace** | `kitchen-replace` | The swap play: when you have a disc in the kitchen, ghost-ball an opponent disc into it — your −10 disc is knocked out and **theirs stays in the kitchen**. A potential 20+ point swing in one shot. |
| **Kitchen clear** | `kitchen-clear` | The rescue: a maximum-weight shot at your **own** kitchen disc to blast it off the court. Losing the disc entirely (0) beats keeping it at −10. |
| **Sweep** | `sweep` | When two or more opponent scorers cluster in one zone, aim through the nearest into the cluster's center of mass — one shot dislodges several. |
| **Hard sweep** | `hard-sweep` | A sweep at maximum weight, punching the nearest disc *through* the cluster. |
| **Ten block** | `ten-block` | Late-frame lane denial: park a disc in the approach lane to the 10 zone so the hammer has no path to it. Only sensible on the second-to-last shot — it scores nothing and exists purely to devalue the reply. |

### Notes on when each shot appears

- `score` dominates the early frame while the board is empty.
- `kitchen` / `clear` appear the moment the opponent has a scorer; kitchen is
  preferred whenever a line to the 10-off exists.
- `block` / `snuggle` appear the moment **you** have an exposed scorer worth
  protecting and shots remain against it.
- `kitchen-replace` / `kitchen-clear` only exist while you have a disc at
  −10; replace is strictly better when an opponent disc is available to swap
  in.
- `sweep` needs a cluster — it is why dumping several discs into the same
  zone against a strong opponent is a mistake.
- `ten-block` is a shot-7-of-8 specialty: with the hammer still to come and
  no scorer of yours worth protecting, denying the 10 outvalues a placement
  that would itself be kitchen-bait.

---

## Aiming Geometry

Two aiming models cover every shot above:

- **Line extension** — extend the ray *shooter → target disc* past the
  target. If the extension crosses the intended destination (kitchen, off the
  back), shoot straight through the disc with enough weight to carry it
  there. Works when geometry happens to be collinear.
- **Ghost ball** — to send a struck disc toward destination `D`: the
  shooting disc must, at contact, sit on the line from `D` **through** the
  target, one disc diameter (6 in) behind it. Aim at that phantom position —
  the "ghost ball" — not at the target disc. This is the general aiming
  model for `kitchen`, `kitchen-replace`, `bump`, and `sweep`, and the reason
  those shots can be generated for *any* board layout.

With the equal-mass, near-elastic collisions of floor shuffleboard
(see `@shuff/motion`), a full hit transfers essentially all velocity along
the contact normal: the struck disc departs along the contact line and the
shooter retains only the tangential remainder. A dead-center hit **sticks**
the shooter at the contact point — which is itself a tactic (`snuggle`
weight into a clear leaves your disc where theirs was).

---

## Decision Principles

How a strong player (or engine) chooses among candidate shots. Deduced from
shuffleboardjam.com's evaluator, which scores every candidate by Monte Carlo
simulation with execution noise; the principles generalize.

### 1. Value a board position by score minus exposure

The value of a candidate shot is not just the points it scores — it is:

```
V(shot) = Δ(my score − their score)
        − w_kitchen · max over my scorers of  P(kitchened) · (s + 10)
        − w_clear   · max over my scorers of  P(cleared)   · s
        + protection bonus for reducing exposure of existing scorers
```

with `w_kitchen ≫ w_clear` (Jam uses 0.6 vs 0.15 — being kitchened is ~4×
the concern of being cleared, before the `+10` even applies).

`P(kitchened)` is fundamentally **geometric**: does an unblocked
line-of-sight exist from any opponent shooting position through my disc to
the 10-off? Blocking every such line drives the probability — and the
penalty — to zero. **This term alone is why guards, snuggles, and hidden
placements win** over naked scoring placements.

### 2. The hammer changes everything

Risk terms exist because the opponent gets a reply. On the **last shot of
the frame there is no reply** — exposure is meaningless, and the correct
play is pure maximum expected points. A placement that would be reckless on
shot 5 is correct on shot 8. Conversely, the second-to-last shot (shot 7) is
where pure denial (`ten-block`) peaks.

### 3. Match score modulates risk appetite

Late in a match, the frame is not played in isolation:

- **Protecting a lead** → weight exposure *more* (Jam: ×2 when up by >5).
  Safe, guarded, low-variance play; a small frame win suffices.
- **Chasing a deficit** → weight exposure *less* (×0.3 when down by >5).
  You cannot guard your way out of a hole; take the aggressive line.

### 4. When losing on the last shot, maximize P(win), not E[points]

If the final shot of the final frame needs a swing of `N` to tie or win,
expected value is the wrong metric: a 15%-chance shot that swings `N` beats
a 90%-chance shot that swings `N − 2`. Every trial outcome is scored
pass/fail against the needed swing. This is the difference between playing
the percentages and playing the *match*.

### 5. Read the court, and discount what you can't read

Real courts are not uniform — speed varies (see `courtSpeed` in project
memory) and outdoor courts drift. Two implications from Jam's model:

- **Plan discount**: a kitchen line that crosses fast/unpredictable court is
  worth less than the same line on readable court — reduce `P(success)`
  accordingly.
- **Execution error**: shots along hard-to-read paths get *worse aim*, not
  just lower confidence. Long shots accumulate more court-reading error than
  short ones.

### 6. Don't create your opponent's sweep

Clustered scorers multiply: two 8s in one zone are not 16 points of
position, they are one `sweep` from being 0. Spread scorers across zones and
lines.

---

## Turn-Order Context

From `RULES.md`: a frame is 8 alternating shots; **Out** shoots first,
**Hammer** shoots last. Strategy is indexed by shot number:

| Shots | Phase | Typical intents |
|---|---|---|
| 1–2 | Open | `score` (Out often shoots a deliberately short/safe opener rather than feed a kitchen target) |
| 3–6 | Middle | the full taxonomy: `kitchen` / `clear` vs `block` / `snuggle`, `bump`, `kitchen-replace` |
| 7 | Set-up | `ten-block`, final guards — devalue the hammer |
| 8 | Hammer | pure value: `score`, `kitchen`, `sweep` — no risk term |

---

## Schema Implications (informational, not normative)

- **`ShotIntent`** — the `label` column above is a proposed enum for
  annotating a Shot in a Sequence (`score`, `kitchen`, `clear`, `hard-clear`,
  `bump`, `block`, `snuggle`, `kitchen-replace`, `kitchen-clear`, `sweep`,
  `hard-sweep`, `ten-block`). Intent is *annotation*, not physics — the same
  disc velocities could serve two intents.
- **Intent is per-shot, not per-disc.** A Sequence entry gains an optional
  `intent`; discs are unchanged.
- **A strategy engine decomposes cleanly** into the two halves Jam uses:
  1. **Candidate generation** — pure geometry per intent (grids over zones,
     line extensions, ghost-ball positions). Depends only on `@shuff/core`.
  2. **Evaluation** — simulate candidates under execution noise and score
     them with the exposure formula. Depends on the physics in
     `@shuff/motion`.
- **Exposure (`P(kitchened)`) is a pure function** of board + shooting
  positions — useful on its own for docs examples ("this disc is exposed,
  these lines threaten it") before any engine exists.

---

## Glossary (strategy terms; extends RULES.md glossary)

| Term | Meaning |
|---|---|
| **Exposed** | (Of a scorer) reachable by an unblocked opponent line that continues kitchen-ward. |
| **Ghost ball** | The phantom disc position, one diameter behind a target along the line to the destination, that a shooter must occupy at contact to send the target to that destination. |
| **Guard** | A disc placed to block an opponent's shooting line to a scorer. Verb: to guard. |
| **Lane** | The corridor from a shooting position to a destination zone. |
| **Stick** | A dead-center hit leaving the shooting disc at the contact point (full velocity transfer). |
| **Swing** | The net change in frame score a shot produces, counting both players' discs (a kitchened 8 is an 18-point swing). |
| **Weight** | Shot speed/power. "Kitchen weight" = enough to carry a struck disc to the 10-off; "hard" = maximum. |
