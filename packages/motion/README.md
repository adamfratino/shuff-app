# @shuff/motion

The physics of floor shuffleboard — the Jam model — as data: analytic
formulas and easing curves for animation, and a numeric shot simulator for
collision outcomes. Motion drives the data; an untouched
[`@shuff/diagram`](../diagram) renders it — so everything derived from disc
position (zone tints, labels, shadows) stays correct mid-flight. Strategy
and roadmap in [`PLAN.md`](PLAN.md).

Disc motion follows Coulomb friction (constant deceleration, stopping
distance ∝ v²), which maps exactly onto quadratic easing curves — each glide
is one Motion animation.

## Install

```sh
pnpm add @shuff/motion @shuff/core motion react
```

`@shuff/core`, `motion`, and `react` are peer dependencies.

## Quick start

The package is headless — your board is plain data, the hook returns the
in-flight frames, and an untouched `Diagram` renders them:

```tsx
import { useState } from "react";

import { Diagram } from "@shuff/diagram";
import { useBoardTransition, type TrackedDisc } from "@shuff/motion";

const INITIAL_BOARD: TrackedDisc[] = [
  { id: "b1", x: 24, y: 60, color: "#1a1a1a" },
];

export const Board = () => {
  const [board, setBoard] = useState(INITIAL_BOARD);
  const discs = useBoardTransition(board);

  // setBoard with new positions and the discs glide there; ids correlate
  // discs across states.
  return <Diagram discs={discs} />;
};
```

## API

- **`useBoardTransition(target, options?)`** — the transition primitive:
  returns the in-flight `TrackedDisc[]` for a target board; retargeting
  mid-flight continues from current positions. Honors
  `prefers-reduced-motion` (snap instead of glide).
- **`simulateShot(board, shot, shooter, courtSpeed?)`** — plays a `Shot`
  through the Jam model numerically (elastic equal-mass collisions, chained
  knock-ons, dead-disc removal) and returns the settled `ShotResult`.
- **`diffBoards(current, target)`** — id-based board diff
  (`added` / `removedIds` / `moves`).
- **Physics** — `DEFAULT_MU`, `launchSpeed`, `glideLength`, `glideDuration`,
  and the exact easing curves `EASE_STROKE`, `EASE_GLIDE`, `EASE_TRAVEL`.
  `courtSpeed` is the friction μ in in/s²; lower is a faster (beaded) court.
- **Types** — `TrackedDisc` (`Disc` with required `id`), `BoardState`,
  `BoardTransitionOptions`.

## License

MIT
