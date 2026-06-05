# @shuff/diagram

A React primitive that renders a shuffleboard half-court with discs at given coordinates. Pairs with [`@shuff/core`](../core) for the underlying scoring and geometry math.

The component always depicts the **target end** of the court in canonical orientation: back baseline at the top, apex pointing toward the centerline. It carries no notion of "yellow side" vs "black side" — that's a shooting-end concept, irrelevant when rendering where discs landed.

See [`../../docs/RULES.md`](../../docs/RULES.md) for the coordinate system and scoring rules.

## Install

```sh
pnpm add @shuff/diagram @shuff/core react
```

`@shuff/core` and `react` are peer dependencies — install both alongside.

## Quick start

```tsx
import { Diagram, type Disc } from "@shuff/diagram";

const discs: Disc[] = [
  { x: 36, y: 108, color: "#f5c518" }, // 10
  { x: 54, y: 38,  color: "#f5c518" }, // 7-right
  { x: 28, y: 72,  color: "#1a1a1a" }, // 8-left
];

export function MyBoard() {
  return <Diagram discs={discs} showLabels />;
}
```

## Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `discs` | `Disc[]` | `[]` | Render order is z-order (later draws on top). |
| `className` | `string` | — | Applied to the root `<svg>` for CSS overrides. |
| `highlightScoring` | `boolean` | `true` | Tints zones containing scoring discs; opacity scales with disc count. |
| `showLabels` | `boolean` | `false` | Adds zone-abbreviation labels below each disc. |
| `variant` | `"half" \| "full"` | `"half"` | `"full"` renders both ends mirrored across `y = 234`. |
| `shooter` | `Point` | — | Draws a shooter marker plus faint projection lines to each disc. |
| `showShadows` | `boolean` | `false` | Requires `shooter`. Translucent shadow polygons behind every disc. |
| `showSpotlight` | `boolean` | `false` | Requires `shooter`. Inverted spotlight: court dimmed except the cone-of-visibility. |

## Styling

The SVG exposes classes for the court surface, each scoring zone, and individual line markings. Override the default theme via CSS:

```css
.my-diagram .shuff-zone-10  { fill: var(--ten-color); }
.my-diagram .shuff-lag-line { stroke: var(--lag-color); }
```

When `highlightScoring` is on, scoring zones receive a `shuff-zone--scoring` modifier class and a `--shuff-zone-count` CSS custom property holding the disc count — wire this into any fill/opacity expression you like.

## License

MIT
