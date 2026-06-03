import type { CSSProperties } from "react";
import { DISC_RADIUS } from "./constants";
import type { Disc, DiagramProps } from "./types";
import { activeScoringZones, scoringZone, type ScoringZone } from "./zones";

const DEFAULT_STYLES = `
  .shuff-court              { fill: #e8e4d8; stroke: none; }
  .shuff-scoring-zones *    { fill: none; }
  .shuff-zone--scoring      { fill: rgba(46, 160, 67, calc(0.18 * var(--shuff-zone-count, 1))); }
  .shuff-zone-kitchen.shuff-zone--scoring { fill: rgba(207, 34, 46, calc(0.15 * var(--shuff-zone-count, 1))); }
  .shuff-markings *         { fill: none; stroke: #2a2a2a; stroke-width: 1; stroke-linecap: square; }
  .shuff-kitchen-separator  { fill: #2a2a2a; stroke: none; }
  .shuff-disc-labels text {
    font: 600 3.5px ui-monospace, SFMono-Regular, Menlo, monospace;
    fill: #1a1a1a;
    paint-order: stroke;
    stroke: #fdfaf2;
    stroke-width: 0.7;
    stroke-linejoin: round;
    pointer-events: none;
  }
`;

type ZoneCustomProperty = CSSProperties & {
  "--shuff-zone-count"?: number;
};

const ZONE_ABBREV: Record<ScoringZone, string> = {
  kitchen: "K",
  "7-left": "7L",
  "7-right": "7R",
  "8-left": "8L",
  "8-right": "8R",
  "10": "10",
};

function labelFor(disc: Disc): string {
  const z = scoringZone(disc);
  return z === null ? "—" : ZONE_ABBREV[z];
}

export function Diagram({
  discs = [],
  className,
  highlightScoring = true,
  showLabels = false,
}: DiagramProps) {
  const zoneCounts = highlightScoring
    ? activeScoringZones(discs)
    : new Map<ScoringZone, number>();

  const zoneProps = (
    zone: ScoringZone,
  ): { className: string; style?: ZoneCustomProperty } => {
    const count = zoneCounts.get(zone);
    if (!count) return { className: `shuff-zone-${zone}` };
    return {
      className: `shuff-zone-${zone} shuff-zone--scoring`,
      style: { "--shuff-zone-count": count },
    };
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 72 234"
      preserveAspectRatio="xMidYMin meet"
      className={className}
    >
      <style>{DEFAULT_STYLES}</style>

      <rect className="shuff-court" x="0" y="0" width="72" height="234" />

      <g className="shuff-scoring-zones">
        <polygon points="0,0 72,0 66,18 6,18" {...zoneProps("kitchen")} />
        <polygon points="0,18 36,18 36,54 12,54" {...zoneProps("7-left")} />
        <polygon points="36,18 72,18 60,54 36,54" {...zoneProps("7-right")} />
        <polygon points="12,54 36,54 36,90 24,90" {...zoneProps("8-left")} />
        <polygon points="36,54 60,54 48,90 36,90" {...zoneProps("8-right")} />
        <polygon points="24,90 48,90 36,126" {...zoneProps("10")} />
      </g>

      <g className="shuff-markings">
        <line className="shuff-kitchen-side-left" x1="0" y1="0" x2="6" y2="18" />
        <line className="shuff-kitchen-side-right" x1="72" y1="0" x2="66" y2="18" />
        <line className="shuff-baseline" x1="0" y1="0" x2="72" y2="0" />
        <line className="shuff-kitchen-7" x1="0" y1="18" x2="72" y2="18" />
        <line className="shuff-edge-left" x1="0" y1="18" x2="36" y2="126" />
        <line className="shuff-edge-right" x1="72" y1="18" x2="36" y2="126" />
        <line className="shuff-line-7-8" x1="12" y1="54" x2="60" y2="54" />
        <line className="shuff-line-8-10" x1="24" y1="90" x2="48" y2="90" />
        <line className="shuff-centerline" x1="36" y1="18" x2="36" y2="90" />
        <line className="shuff-lag-line" x1="0" y1="162" x2="72" y2="162" />
        <polygon className="shuff-kitchen-separator" points="34,0 38,0 36,17" />
      </g>

      {discs.length > 0 && (
        <g className="shuff-discs">
          {discs.map((disc, index) => (
            <circle
              key={index}
              cx={disc.x}
              cy={disc.y}
              r={DISC_RADIUS}
              fill={disc.color}
            />
          ))}
        </g>
      )}

      {showLabels && discs.length > 0 && (
        <g className="shuff-disc-labels">
          {discs.map((disc, index) => (
            <text
              key={index}
              x={disc.x}
              y={disc.y + DISC_RADIUS + 3.5}
              textAnchor="middle"
            >
              {labelFor(disc)}
            </text>
          ))}
        </g>
      )}
    </svg>
  );
}
