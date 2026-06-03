import { Diagram, type Disc, score, scoringZone } from "@shuff/diagram";

const YELLOW = "#f5c518";
const BLACK = "#1a1a1a";

const frameDiscs: Disc[] = [
  { x: 36, y: 108, color: YELLOW }, // 10
  { x: 54, y: 38, color: YELLOW }, // 7-right
  { x: 12, y: 25, color: YELLOW }, // 7-left
  { x: 20, y: 50, color: BLACK }, // 7-left
  { x: 42, y: 64, color: YELLOW }, // 8-right
  { x: 46, y: 80, color: BLACK }, // 8-right
  { x: 28, y: 72, color: BLACK }, // 8-left
  { x: 22, y: 10, color: BLACK }, // kitchen
];

const thresholdDiscs: Disc[] = [
  { x: 36, y: 93.6, color: YELLOW }, // just past 3.5" from 8/10 line
  { x: 36, y: 93.4, color: BLACK }, // just short — no score
  { x: 36, y: 36, color: YELLOW }, // straddles centerline — no score
  { x: 36, y: 140, color: BLACK }, // buffer — no score
];

// 23 discs — one at each corner of each scoring area, just inside the 3.5"
// clearance from both intersecting lines. Yellow chosen for visibility against
// the saturated green/red tints that result from 3-4 discs per zone.
const cornerDiscs: Disc[] = [
  // Kitchen — 4 corners (back-left, back-right, front-left, front-right)
  { x: 5, y: 3.6, color: YELLOW },
  { x: 67, y: 3.6, color: YELLOW },
  { x: 8.6, y: 14.4, color: YELLOW },
  { x: 63.4, y: 14.4, color: YELLOW },
  // 7-left
  { x: 5, y: 21.6, color: YELLOW },
  { x: 32.4, y: 21.6, color: YELLOW },
  { x: 32.4, y: 50.4, color: YELLOW },
  { x: 14.7, y: 50.4, color: YELLOW },
  // 7-right
  { x: 39.6, y: 21.6, color: YELLOW },
  { x: 67, y: 21.6, color: YELLOW },
  { x: 57.3, y: 50.4, color: YELLOW },
  { x: 39.6, y: 50.4, color: YELLOW },
  // 8-left
  { x: 17, y: 57.6, color: YELLOW },
  { x: 32.4, y: 57.6, color: YELLOW },
  { x: 32.4, y: 86.4, color: YELLOW },
  { x: 26.6, y: 86.4, color: YELLOW },
  // 8-right
  { x: 39.6, y: 57.6, color: YELLOW },
  { x: 55, y: 57.6, color: YELLOW },
  { x: 45.4, y: 86.4, color: YELLOW },
  { x: 39.6, y: 86.4, color: YELLOW },
  // 10 zone — 3 corners (back-left, back-right, near apex)
  { x: 29, y: 93.6, color: YELLOW },
  { x: 43, y: 93.6, color: YELLOW },
  { x: 36, y: 114.8, color: YELLOW },
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

type PanelProps = {
  title: string;
  description?: string;
  discs: Disc[];
  showLabels?: boolean;
  showTable?: boolean;
};

function Panel({
  title,
  description,
  discs,
  showLabels = true,
  showTable = true,
}: PanelProps) {
  const totals = totalsByColor(discs);
  const scoringCount = discs.filter((d) => scoringZone(d) !== null).length;
  return (
    <section style={{ marginBottom: "3rem" }}>
      <h2>{title}</h2>
      {description && (
        <p style={{ color: "#555", marginTop: -8 }}>{description}</p>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        <Diagram discs={discs} showLabels={showLabels} />
        <div>
          {showTable ? (
            <>
              <table
                style={{
                  borderCollapse: "collapse",
                  fontSize: 14,
                  width: "100%",
                }}
              >
                <thead>
                  <tr
                    style={{
                      textAlign: "left",
                      borderBottom: "1px solid #ccc",
                    }}
                  >
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
                          style={{
                            padding: "4px 8px",
                            fontFamily: "monospace",
                          }}
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
            </>
          ) : (
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>
              <p style={{ marginTop: 0 }}>
                <strong>{discs.length}</strong> discs total,{" "}
                <strong>{scoringCount}</strong> scoring.
              </p>
              <p>
                Sum:{" "}
                <code style={{ fontSize: 14 }}>
                  {formatScore(
                    Object.values(totals).reduce((a, b) => a + b, 0),
                  )}
                </code>
              </p>
            </div>
          )}
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
        title="Sample frame"
        description="8 discs (4 yellow + 4 black). 7-left and 8-right each carry 2 discs to demo opacity scaling."
        discs={frameDiscs}
      />
      <Panel
        title="Threshold cases"
        description='Four discs at and around the 3.5" clearance threshold. Only the disc just past the 8/10 line scores.'
        discs={thresholdDiscs}
      />
      <Panel
        title="Corner discs — all scoring"
        description="23 discs, one at each corner of each scoring area (4 per kitchen / 7L / 7R / 8L / 8R, 3 for the 10 zone including the near-apex corner). Every disc is just inside the 3.5&quot; clearance from both intersecting lines."
        discs={cornerDiscs}
        showLabels={false}
        showTable={false}
      />
    </main>
  );
}
