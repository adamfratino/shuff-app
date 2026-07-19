# @shuff/strategy

Shuffleboard shot strategy: candidate generation, exposure analysis, and
Monte Carlo shot selection. Implements the shot taxonomy and decision
principles in [`docs/STRATEGY.md`](../../docs/STRATEGY.md); the model is
ported from the CPU opponent at [shuffleboardjam.com](https://shuffleboardjam.com/),
adapted to `@shuff/core` geometry and ILSA scoring.

All positions are in the half-court coordinate system (`docs/RULES.md`):
inches, back baseline at `y = 0`, shots released from `y = 230`.

## The pieces

```
candidates  →  pure geometry: every plausible aim per named shot
simulate    →  friction + elastic collisions, stepped to rest
exposure    →  P(a scorer gets kitchened / cleared), by line of sight
evaluate    →  Monte Carlo under execution noise, exposure-weighted
```

Each layer is exported on its own — `kitchenExposure` can annotate a docs
diagram ("this disc is exposed along these lines") without ever running
the evaluator.

## Choosing a shot

```ts
import { chooseShot } from "@shuff/strategy";

const best = chooseShot(board, { color: "yellow", shotNumber: 4 });
// best.candidate.intent  → e.g. "kitchen"
// best.candidate.start/aim/speed → the shot itself
// best.value → mean simulated value (score swing minus weighted exposure)
```

`rankShots` returns every candidate evaluated and sorted — useful for
showing the top replies to a position. `simulateShot` plays any `Shot`
forward to rest, returning surviving and dead discs.

## Situational knobs

- `shotNumber: 8` — the hammer: risk terms vanish, pure value.
- `shotNumber: 7` — unlocks `ten-block` lane-denial candidates.
- `lastFrame` + `scoreGap` — protect a lead / chase a deficit; on the
  hammer of a losing last frame the evaluator maximizes P(win), not
  expected points.
- `courtSpeed` — friction μ, same knob as `@shuff/motion`.
- `speedNoise` / `angleNoise` — execution skill; defaults calibrated to
  the reference model's "advanced" CPU.
- `rng` — inject a seeded generator for reproducible evaluation.

## What this is not

No drift-court modeling (the reference site's signature feature) and no
multi-shot lookahead — evaluation is one shot deep with a geometric model
of the opponent's reply, which is exactly as deep as the reference AI
goes.
