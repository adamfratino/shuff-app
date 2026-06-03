import { Diagram, type Disc, score, scoringZone } from "@shuff/diagram";

const YELLOW = "#f5c518";
const BLACK = "#1a1a1a";

const frameDiscs: Disc[] = [
  // 10 zone (1)
  { x: 36, y: 108, color: YELLOW },
  // 7-right (1)
  { x: 54, y: 38, color: YELLOW },
  // 7-left (2 — opacity scales x2)
  { x: 12, y: 25, color: YELLOW },
  { x: 20, y: 50, color: BLACK },
  // 8-right (2 — opacity scales x2)
  { x: 42, y: 64, color: YELLOW },
  { x: 46, y: 80, color: BLACK },
  // 8-left (1)
  { x: 28, y: 72, color: BLACK },
  // Kitchen (1)
  { x: 22, y: 10, color: BLACK },
];

const boundaryDiscs: Disc[] = [
  // Just past 3.5" clearance from the 8/10 line — should score 10
  { x: 36, y: 93.6, color: YELLOW },
  // Just short of clearance — does NOT score
  { x: 36, y: 93.4, color: BLACK },
  // Straddling the centerline in 7 zone — does NOT score
  { x: 36, y: 36, color: YELLOW },
  // In the apex-to-lag-line buffer — does NOT score
  { x: 36, y: 140, color: BLACK },
];

function totalsByColor(discs: Disc[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const disc of discs) {
    totals[disc.color] = (totals[disc.color] ?? 0) + score(disc);
  }
  return totals;
}

function formatScore(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

function ColorChip({ color }: { color: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 14,
        height: 14,
        borderRadius: 7,
        background: color,
        border: "1px solid #999",
        verticalAlign: "middle",
      }}
    />
  );
}

function Panel({ title, discs }: { title: string; discs: Disc[] }) {
  const totals = totalsByColor(discs);
  return (
    <section style={{ marginBottom: "3rem" }}>
      <h2>{title}</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        <Diagram discs={discs} />
        <div>
          <table
            style={{
              borderCollapse: "collapse",
              fontSize: 14,
              width: "100%",
            }}
          >
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
                <th style={{ padding: "4px 8px" }}>#</th>
                <th style={{ padding: "4px 8px" }}>Disc</th>
                <th style={{ padding: "4px 8px" }}>Position</th>
                <th style={{ padding: "4px 8px" }}>Zone</th>
                <th style={{ padding: "4px 8px", textAlign: "right" }}>
                  Score
                </th>
              </tr>
            </thead>
            <tbody>
              {discs.map((disc, i) => {
                const zone = scoringZone(disc);
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "4px 8px" }}>{i + 1}</td>
                    <td style={{ padding: "4px 8px" }}>
                      <ColorChip color={disc.color} />
                    </td>
                    <td
                      style={{ padding: "4px 8px", fontFamily: "monospace" }}
                    >
                      ({disc.x}, {disc.y})
                    </td>
                    <td style={{ padding: "4px 8px" }}>
                      {zone ?? <em style={{ color: "#999" }}>no score</em>}
                    </td>
                    <td
                      style={{
                        padding: "4px 8px",
                        textAlign: "right",
                        fontFamily: "monospace",
                      }}
                    >
                      {formatScore(score(disc))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <h3 style={{ marginTop: "1.5rem" }}>Totals</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {Object.entries(totals).map(([color, total]) => (
              <li
                key={color}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 0",
                  fontFamily: "monospace",
                }}
              >
                <ColorChip color={color} />
                {formatScore(total)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function App() {
  return (
    <main
      style={{
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
        maxWidth: 960,
        margin: "0 auto",
      }}
    >
      <h1>shuff diagram playground</h1>
      <Panel
        title="Sample frame — opacity scales with disc count per zone"
        discs={frameDiscs}
      />
      <Panel
        title='Boundary cases — at and around the 3.5" clearance threshold'
        discs={boundaryDiscs}
      />
    </main>
  );
}
