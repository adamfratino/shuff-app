import { describe, expect, it } from "vitest";
import { APEX, KITCHEN_DEPTH, LAG_LINE_Y } from "./constants";
import {
  activeScoringZones,
  frameScore,
  isAlive,
  SCORING_CLEARANCE,
  score,
  scoringZone,
  zoneAt,
} from "./zones";

const SQRT_10 = Math.sqrt(10);
const EPS = 0.001;

describe("zoneAt — point classification", () => {
  it("classifies a point in the kitchen", () => {
    expect(zoneAt(36, 9)).toBe("kitchen");
  });

  it("classifies a point in 7-left and 7-right around the centerline", () => {
    expect(zoneAt(20, 36)).toBe("7-left");
    expect(zoneAt(52, 36)).toBe("7-right");
  });

  it("classifies a point in 8-left and 8-right", () => {
    expect(zoneAt(30, 72)).toBe("8-left");
    expect(zoneAt(42, 72)).toBe("8-right");
  });

  it("classifies a point in the 10 zone", () => {
    expect(zoneAt(36, 108)).toBe("10");
  });

  it("classifies a point in the apex-to-lag-line buffer", () => {
    expect(zoneAt(36, 140)).toBe("buffer");
  });

  it("classifies a point past the lag line as dead-zone", () => {
    expect(zoneAt(36, LAG_LINE_Y + 1)).toBe("dead-zone");
  });

  it("classifies a point past the back baseline as off-court", () => {
    expect(zoneAt(36, -1)).toBe("off-court");
  });

  it("treats points outside the kitchen's trapezoidal edges as off-court", () => {
    // At y=12, kitchen left edge is x = 12/3 = 4. A point at x=2 is outside.
    expect(zoneAt(2, 12)).toBe("off-court");
    expect(zoneAt(70, 12)).toBe("off-court");
  });

  it("treats points outside the scoring triangle (below apex y) as off-court", () => {
    // At y=100, triangle left edge x = (100-18)/3 ≈ 27.33. A point at x=10 is outside.
    expect(zoneAt(10, 100)).toBe("off-court");
  });

  it("assigns the centerline (x=36) to the right half in 7 and 8 zones", () => {
    expect(zoneAt(APEX.x, 36)).toBe("7-right");
    expect(zoneAt(APEX.x, 72)).toBe("8-right");
  });

  it("assigns transverse boundary points to the higher-y zone", () => {
    // y = 18 (kitchen/7): should be 7 not kitchen
    expect(zoneAt(36, KITCHEN_DEPTH)).not.toBe("kitchen");
    // y = 54 (7/8): should be 8 not 7
    expect(zoneAt(30, 54)).toBe("8-left");
    // y = 90 (8/10): should be 10 not 8
    expect(zoneAt(36, 90)).toBe("10");
  });
});

describe("scoringZone — fully-within-lines rule", () => {
  it("returns the zone for a disc clearly inside", () => {
    expect(scoringZone({ x: 36, y: 108, color: "y" })).toBe("10");
    expect(scoringZone({ x: 28, y: 72, color: "y" })).toBe("8-left");
    expect(scoringZone({ x: 46, y: 72, color: "y" })).toBe("8-right");
    expect(scoringZone({ x: 18, y: 38, color: "y" })).toBe("7-left");
    expect(scoringZone({ x: 54, y: 38, color: "y" })).toBe("7-right");
    expect(scoringZone({ x: 22, y: 10, color: "y" })).toBe("kitchen");
  });

  it("returns null for a disc straddling the centerline", () => {
    // Center exactly on the centerline in a 7/8 zone — touching the painted centerline
    expect(scoringZone({ x: 36, y: 36, color: "y" })).toBeNull();
    expect(scoringZone({ x: 36, y: 72, color: "y" })).toBeNull();
  });

  it("scores a disc whose center is exactly SCORING_CLEARANCE from the centerline", () => {
    // Right at the threshold — 3.5" from centerline, in 7-left
    const x = APEX.x - SCORING_CLEARANCE;
    expect(scoringZone({ x, y: 36, color: "y" })).toBe("7-left");
  });

  it("does not score a disc fractionally closer than SCORING_CLEARANCE to the centerline", () => {
    const x = APEX.x - SCORING_CLEARANCE + EPS;
    expect(scoringZone({ x, y: 36, color: "y" })).toBeNull();
  });

  it("scores a disc exactly SCORING_CLEARANCE past the 8/10 line", () => {
    // y = 90 + 3.5 = 93.5
    expect(scoringZone({ x: 36, y: 90 + SCORING_CLEARANCE, color: "y" })).toBe(
      "10",
    );
  });

  it("does not score a disc fractionally short of the 8/10 line", () => {
    expect(
      scoringZone({ x: 36, y: 90 + SCORING_CLEARANCE - EPS, color: "y" }),
    ).toBeNull();
  });

  it("scores a disc just past SCORING_CLEARANCE from the triangle's left edge", () => {
    // Edge: 3x − y + 18 = 0. Distance = (3x − y + 18) / sqrt(10) = SCORING_CLEARANCE
    // For y = 36: 3x − 18 = 3.5 * sqrt(10); x = (18 + 3.5*sqrt(10)) / 3.
    // The exact threshold is fuzzy under floating-point; nudge slightly inside.
    const y = 36;
    const x = (3.5 * SQRT_10 + y - 18) / 3 + EPS;
    expect(scoringZone({ x, y, color: "y" })).toBe("7-left");
  });

  it("does not score a disc just outside the triangle's left edge", () => {
    const y = 36;
    const x = (3.5 * SQRT_10 + y - 18) / 3 - EPS;
    expect(scoringZone({ x, y, color: "y" })).toBeNull();
  });

  it("scores a disc in the buffer past the apex as null", () => {
    expect(scoringZone({ x: 36, y: 140, color: "y" })).toBeNull();
  });

  it("returns null for a disc straddling the back baseline of the kitchen", () => {
    // Disc center at y=3 — too close to back baseline (y=0)
    expect(scoringZone({ x: 36, y: 3, color: "y" })).toBeNull();
  });

  it("scores a disc near (but not touching) the kitchen separator triangle", () => {
    // Separator: 34,0 38,0 36,17. Decorative — not a scoring line.
    // A disc at (32, 10) is left of the separator; should score kitchen.
    expect(scoringZone({ x: 32, y: 10, color: "y" })).toBe("kitchen");
  });
});

describe("score — point values", () => {
  it("returns the zone's value for a scoring disc", () => {
    expect(score({ x: 36, y: 108, color: "y" })).toBe(10);
    expect(score({ x: 28, y: 72, color: "y" })).toBe(8);
    expect(score({ x: 18, y: 38, color: "y" })).toBe(7);
    expect(score({ x: 22, y: 10, color: "y" })).toBe(-10);
  });

  it("returns 0 for a disc not in a scoring zone", () => {
    expect(score({ x: 36, y: 140, color: "y" })).toBe(0); // buffer
    expect(score({ x: 36, y: 180, color: "y" })).toBe(0); // dead zone
    expect(score({ x: 36, y: 36, color: "y" })).toBe(0); // on centerline
  });
});

describe("activeScoringZones — counts by zone", () => {
  it("counts scoring discs per zone", () => {
    const discs = [
      { x: 36, y: 108, color: "y" }, // 10
      { x: 28, y: 72, color: "y" }, // 8-left
      { x: 30, y: 80, color: "y" }, // 8-left (stacked into same zone)
      { x: 22, y: 10, color: "y" }, // kitchen
    ];
    const counts = activeScoringZones(discs);
    expect(counts.get("10")).toBe(1);
    expect(counts.get("8-left")).toBe(2);
    expect(counts.get("kitchen")).toBe(1);
    expect(counts.has("7-left")).toBe(false);
  });

  it("ignores non-scoring discs", () => {
    const discs = [
      { x: 36, y: 36, color: "y" }, // on centerline → null
      { x: 36, y: 140, color: "y" }, // buffer → null
    ];
    expect(activeScoringZones(discs).size).toBe(0);
  });
});

describe("corner discs — every scoring zone corner just barely scores", () => {
  // Same 23 positions rendered in the playground's corner-discs panel. Each
  // is positioned just inside the 3.5" clearance from BOTH intersecting
  // boundary lines that form a corner of its zone. If any corner regresses
  // (i.e., the disc no longer scores), the zone-clearance math has drifted.
  it.each<
    [
      string,
      number,
      number,
      "kitchen" | "7-left" | "7-right" | "8-left" | "8-right" | "10",
    ]
  >([
    // Kitchen (trapezoidal, 4 corners)
    ["kitchen back-left", 5, 3.6, "kitchen"],
    ["kitchen back-right", 67, 3.6, "kitchen"],
    ["kitchen front-left", 8.6, 14.4, "kitchen"],
    ["kitchen front-right", 63.4, 14.4, "kitchen"],
    // 7-left
    ["7-left back-left", 5, 21.6, "7-left"],
    ["7-left back-right", 32.4, 21.6, "7-left"],
    ["7-left front-right", 32.4, 50.4, "7-left"],
    ["7-left front-left", 14.7, 50.4, "7-left"],
    // 7-right
    ["7-right back-left", 39.6, 21.6, "7-right"],
    ["7-right back-right", 67, 21.6, "7-right"],
    ["7-right front-right", 57.3, 50.4, "7-right"],
    ["7-right front-left", 39.6, 50.4, "7-right"],
    // 8-left
    ["8-left back-left", 17, 57.6, "8-left"],
    ["8-left back-right", 32.4, 57.6, "8-left"],
    ["8-left front-right", 32.4, 86.4, "8-left"],
    ["8-left front-left", 26.6, 86.4, "8-left"],
    // 8-right
    ["8-right back-left", 39.6, 57.6, "8-right"],
    ["8-right back-right", 55, 57.6, "8-right"],
    ["8-right front-right", 45.4, 86.4, "8-right"],
    ["8-right front-left", 39.6, 86.4, "8-right"],
    // 10 zone (triangle, 3 corners)
    ["10 back-left", 29, 93.6, "10"],
    ["10 back-right", 43, 93.6, "10"],
    ["10 near-apex", 36, 114.8, "10"],
  ])("%s scores %s", (_label, x, y, expected) => {
    expect(scoringZone({ x, y, color: "y" })).toBe(expected);
  });
});

describe("frameScore — per-color totals", () => {
  it("sums scoring discs by color", () => {
    const discs = [
      { x: 36, y: 108, color: "yellow" }, // +10 yellow
      { x: 28, y: 72, color: "yellow" }, //  +8 yellow
      { x: 46, y: 72, color: "black" }, //  +8 black
      { x: 22, y: 10, color: "black" }, // -10 black (kitchen)
    ];
    const totals = frameScore(discs);
    expect(totals.get("yellow")).toBe(18);
    expect(totals.get("black")).toBe(-2);
  });

  it("returns 0 for a color whose discs are all non-scoring", () => {
    const discs = [
      { x: 36, y: 36, color: "yellow" }, // on centerline — no score
      { x: 36, y: 140, color: "yellow" }, // buffer — no score
    ];
    expect(frameScore(discs).get("yellow")).toBe(0);
  });

  it("returns an empty map for no discs", () => {
    expect(frameScore([]).size).toBe(0);
  });

  it("does not cancel scores between colors", () => {
    // Two opposing discs both in 8 zones — both should score 8.
    const discs = [
      { x: 28, y: 72, color: "yellow" }, // 8-left
      { x: 46, y: 72, color: "black" }, // 8-right
    ];
    const totals = frameScore(discs);
    expect(totals.get("yellow")).toBe(8);
    expect(totals.get("black")).toBe(8);
  });

  it("is color-agnostic — keys are whatever strings appear", () => {
    const discs = [
      { x: 36, y: 108, color: "#f5c518" }, // +10
      { x: 28, y: 72, color: "team-1" }, // +8
    ];
    const totals = frameScore(discs);
    expect(totals.get("#f5c518")).toBe(10);
    expect(totals.get("team-1")).toBe(8);
  });
});

describe("isAlive — basic liveness", () => {
  it("is alive for a disc on the scoring side", () => {
    expect(isAlive({ x: 36, y: 100, color: "y" })).toBe(true);
  });

  it("is dead for a disc short of the lag line", () => {
    expect(isAlive({ x: 36, y: 200, color: "y" })).toBe(false);
  });

  it("is dead for a disc past the back baseline", () => {
    expect(isAlive({ x: 36, y: -1, color: "y" })).toBe(false);
  });

  it("is dead for a disc off the side", () => {
    expect(isAlive({ x: -1, y: 100, color: "y" })).toBe(false);
    expect(isAlive({ x: 73, y: 100, color: "y" })).toBe(false);
  });
});
