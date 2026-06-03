import { DISC_RADIUS } from "./constants";
import type { DiagramProps } from "./types";

const DEFAULT_STYLES = `
  .shuff-court              { fill: #e8e4d8; stroke: none; }
  .shuff-scoring-zones *    { fill: none; }
  .shuff-markings *         { fill: none; stroke: #2a2a2a; stroke-width: 1; stroke-linecap: square; }
  .shuff-kitchen-separator  { fill: #2a2a2a; stroke: none; }
`;

export function Diagram({ discs = [], className }: DiagramProps) {
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
        <polygon className="shuff-zone-kitchen" points="0,0 72,0 66,18 6,18" />
        <polygon className="shuff-zone-7-left" points="0,18 36,18 36,54 12,54" />
        <polygon className="shuff-zone-7-right" points="36,18 72,18 60,54 36,54" />
        <polygon className="shuff-zone-8-left" points="12,54 36,54 36,90 24,90" />
        <polygon className="shuff-zone-8-right" points="36,54 60,54 48,90 36,90" />
        <polygon className="shuff-zone-10" points="24,90 48,90 36,126" />
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
    </svg>
  );
}
