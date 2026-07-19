# @shuff/motion

Animation layer for [`@shuff/diagram`](../diagram). Motion drives the data;
the untouched Diagram renders it — so everything derived from disc position
(zone tints, labels, shadows) stays correct mid-flight. Strategy and roadmap
in [`PLAN.md`](PLAN.md).

Disc motion follows floor-shuffleboard physics: Coulomb friction (constant
deceleration, stopping distance ∝ v²), which maps exactly onto quadratic
easing curves — each glide is one Motion animation.

## Install

```sh
pnpm add @shuff/motion @shuff/diagram @shuff/core motion react
```

`@shuff/core`, `@shuff/diagram`, `motion`, and `react` are peer dependencies.

## Quick start

```tsx
import { AnimatedDiagram, type TrackedDisc } from "@shuff/motion";

const discs: TrackedDisc[] = [
  { id: "y1", x: 36, y: 108, color: "#f5c518" },
  { id: "b1", x: 28, y: 72, color: "#1a1a1a" },
];

// Change any disc's x/y and it glides there; ids correlate discs across
// states. All other Diagram props pass through.
export function Board() {
  return <AnimatedDiagram discs={discs} showLabels />;
}
```

Or headless, for custom rendering:

```tsx
import { useBoardTransition } from "@shuff/motion";
import { Diagram } from "@shuff/diagram";

const inFlight = useBoardTransition(targetDiscs, { courtSpeed: 120 });
return <Diagram discs={inFlight} />;
```

## API

- **`<AnimatedDiagram discs courtSpeed? reducedMotion? {...DiagramProps}>`** —
  drop-in `Diagram` that animates disc changes.
- **`useBoardTransition(target, options?)`** — the transition primitive:
  returns the in-flight `TrackedDisc[]` for a target board; retargeting
  mid-flight continues from current positions. Honors
  `prefers-reduced-motion` (snap instead of glide).
- **`diffBoards(current, target)`** — id-based board diff
  (`added` / `removedIds` / `moves`).
- **Physics** — `DEFAULT_MU`, `launchSpeed`, `glideLength`, `glideDuration`,
  and the exact easing curves `EASE_STROKE`, `EASE_GLIDE`, `EASE_TRAVEL`.
  `courtSpeed` is the friction μ in in/s²; lower is a faster (beaded) court.
- **Types** — `TrackedDisc` (`Disc` with required `id`), `BoardState`,
  `BoardTransitionOptions`.

## License

MIT
