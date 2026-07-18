import { Stack, Table, Text } from "@uiid/design-system";
import {
  type Disc,
  frameScore,
  occlusion,
  type Point,
  score,
  scoringZone,
} from "@shuff/core";

export const YELLOW = "#f5c518";
export const BLACK = "#1a1a1a";

/**
 * Fixed court-column widths (px). The court SVG is long and narrow, so full
 * courts (2× the length) render at roughly half the width of half courts to
 * keep their on-page height comparable.
 */
export const COURT_WIDTH = 200;

/** Small round color swatch standing in for a disc's color. */
export function DiscChip({ color }: { readonly color: string }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: 14,
        height: 14,
        borderRadius: 7,
        background: color,
        border: "1px solid rgba(0,0,0,0.25)",
        verticalAlign: "middle",
      }}
    />
  );
}

const Mono = ({
  children,
  muted,
}: React.PropsWithChildren<{ muted?: boolean }>) => (
  <Text family="mono" size={-1} shade={muted ? "muted" : undefined}>
    {children}
  </Text>
);

export function formatScore(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

/** Per-color running totals for a frame, reskinned from the playground list. */
function Totals({ discs }: { readonly discs: readonly Disc[] }) {
  const totals = frameScore([...discs]);
  return (
    <Stack gap={2} ax="stretch">
      <Text render={<h4 />} size={1} weight="semibold">
        Totals
      </Text>
      <Stack gap={1}>
        {[...totals].map(([color, total]) => (
          <Text key={color} family="mono" size={-1}>
            <DiscChip color={color} /> {formatScore(total)}
          </Text>
        ))}
      </Stack>
    </Stack>
  );
}

/**
 * The scoring breakdown that accompanies most frame examples: one row per
 * disc with its position, resolved scoring zone, and point value, plus the
 * per-color totals. Reskinned onto the design-system `Table`.
 */
export function ScoreTable({ discs }: { readonly discs: readonly Disc[] }) {
  const rows = discs.map((disc, i) => {
    const zone = scoringZone(disc);
    return {
      "#": i + 1,
      Disc: <DiscChip color={disc.color} />,
      Position: (
        <Mono>
          ({disc.x}, {disc.y})
        </Mono>
      ),
      Zone: zone ?? <Mono muted>no score</Mono>,
      Score: <Mono>{formatScore(score(disc))}</Mono>,
    };
  });
  return (
    <Stack gap={4} ax="stretch" fullwidth>
      <Table items={rows} bordered striped />
      <Totals discs={discs} />
    </Stack>
  );
}

/**
 * Line-of-sight breakdown for the occlusion example: for each disc, how much
 * of it the shooter cannot see and which discs are doing the blocking.
 */
export function OcclusionTable({
  shooter,
  discs,
}: {
  readonly shooter: Point;
  readonly discs: readonly Disc[];
}) {
  const rows = discs.map((target, i) => {
    const others = discs.filter((_, j) => j !== i);
    const result = occlusion(shooter, target, [...others]);
    return {
      "#": i + 1,
      Disc: <DiscChip color={target.color} />,
      Position: (
        <Mono>
          ({target.x}, {target.y})
        </Mono>
      ),
      Obscured: <Mono>{(result.fraction * 100).toFixed(1)}%</Mono>,
      Inches: <Mono>{result.inches.toFixed(2)}&quot;</Mono>,
      Blockers: <Mono>{result.blockers.length}</Mono>,
    };
  });
  return (
    <Stack ax="stretch" fullwidth>
      <Table items={rows} bordered striped />
    </Stack>
  );
}
