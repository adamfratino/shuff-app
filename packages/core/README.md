# @shuff/core

Pure geometry, scoring, and rules math for shuffleboard. Framework-agnostic, zero runtime dependencies.

Models the half-court playing surface per ILSA specification: dimensions, scoring zones, the 3.5" "fully within the lines" clearance rule, line-of-sight occlusion math, and shadow geometry for spotlight rendering. The library does no rendering itself — pair it with [`@shuff/diagram`](../diagram) for SVG output, or build your own UI on top.

See [`../../docs/RULES.md`](../../docs/RULES.md) for the underlying coordinate system, scoring rules, and vocabulary.

## Install

```sh
pnpm add @shuff/core
```

## Quick start

```ts
import { score, scoringZone, occlusion, type Disc, type Point } from "@shuff/core";

const disc: Disc = { x: 36, y: 108, color: "#f5c518" };

scoringZone(disc); // "10"
score(disc);      // 10

// Line-of-sight: is the target disc blocked by others from the shooter's view?
const shooter: Point = { x: 15, y: 459 };
const target: Disc  = { x: 15, y: 30, color: "y" };
const others: Disc[] = [{ x: 15, y: 45, color: "y" }];

const result = occlusion(shooter, target, others);
// { fraction: 1, inches: 6, blockers: [...] }
```

## Modules

- **Constants** (`DISC_DIAMETER`, `DISC_RADIUS`, `HALF_COURT_WIDTH`, `HALF_COURT_LENGTH`, `FULL_COURT_LENGTH`, `APEX`, `LAG_LINE_Y`, `KITCHEN_DEPTH`) — ILSA half-court dimensions in inches.
- **Zones** (`zoneAt`, `scoringZone`, `score`, `scoreValue`, `isScoringZone`, `isAlive`, `activeScoringZones`, `SCORING_CLEARANCE`, `LINE_WIDTH`) — point/disc classification and scoring per ILSA 1.3.1.
- **Geometry** (`occlusion`, `isOccluded`, `findBlockers`, `tangentPoints`, `shadowPolygon`) — line-of-sight math from any viewpoint.
- **Types** (`Disc`, `Point`, `Zone`, `ScoringZone`, `OcclusionResult`) — shared data shapes.

## Coordinate system

Coordinates are in inches, in the half-court coordinate system documented in [`docs/RULES.md`](../../docs/RULES.md):

- `x ∈ [0, 72]` — 0 at the left side line, 72 at the right side line. Centerline at `x = 36`.
- `y ∈ [0, 234]` — 0 at the back baseline, increasing forward toward the full-court centerline.

Reference landmarks: apex of the 10 at `(36, 126)`, lag line at `y = 162`.

## License

MIT
