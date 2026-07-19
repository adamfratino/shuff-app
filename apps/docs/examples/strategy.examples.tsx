"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Button, Group, Stack, Text } from "@uiid/design-system";
import { type Disc, frameScore } from "@shuff/core";
import { Diagram } from "@shuff/diagram";
import {
  blockCandidates,
  clearExposure,
  evaluateShot,
  type EvaluatedShot,
  kitchenCandidates,
  kitchenExposure,
  kitchenReplaceCandidates,
  LEFT_STARTS,
  resolveOptions,
  type ResolvedStrategyOptions,
  scoreCandidates,
  type ShotCandidate,
  snuggleCandidates,
  type StrategyOptions,
  sweepCandidates,
} from "@shuff/strategy";

import { BLACK, COURT_WIDTH, DiscChip, formatScore, YELLOW } from "./_shared";
import { exposureGuard, exposureScorer, playbookBoards } from "./data";
import { usePhysicsBoard } from "./use-physics-board";

/** Seeded PRNG so each scenario's engine pick is stable across renders. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Scenario = {
  id: keyof typeof playbookBoards;
  label: string;
  blurb: string;
  /** Generates only this tactic's candidates — the engine picks among them. */
  plan: (board: readonly Disc[], opts: ResolvedStrategyOptions) => ShotCandidate[];
  options?: Partial<StrategyOptions>;
};

const SCENARIOS: Scenario[] = [
  {
    id: "kitchen",
    label: "The kitchen shot",
    blurb:
      "Their 8 sits on an open line. Shoot straight through it into the 10-off: their +8 becomes −10 — an 18-point swing — and a clean stick-and-follow leaves your shooter scoring near where theirs stood.",
    plan: (board, opts) => kitchenCandidates(board, opts),
  },
  {
    id: "guard",
    label: "The guard",
    blurb:
      "Your own 8 is naked on an open line — not 8 points of position but an 18-point liability. Park a disc on the opponent's shooting line in front of it and the kitchen threat drops to zero. Here the guard even lands in the 8 itself.",
    plan: (board, opts) => blockCandidates(board, opts),
  },
  {
    id: "snuggle",
    label: "The snuggle",
    blurb:
      "Park your disc one diameter in front of their scorer. Any attack on yours now drives it into their own disc — your disc is protected by their material, and their bump line is gone.",
    plan: (board, opts) => snuggleCandidates(board, opts),
  },
  {
    id: "kitchen-replace",
    label: "Kitchen replace",
    blurb:
      "You have a disc stuck at −10 and they have a scorer above it. Ghost-ball their disc into yours: yours is knocked out of the kitchen, theirs stays in it. One shot, a 20+ point swing.",
    plan: (board, opts) => kitchenReplaceCandidates(board, opts),
  },
  {
    id: "sweep",
    label: "The sweep",
    blurb:
      "Two of their scorers share the 8 zone — that's not 16 points of position, it's one shot from being nothing. Punch through the nearest into the cluster's center of mass and take them both.",
    plan: (board, opts) => sweepCandidates(board, opts),
  },
  {
    id: "hammer",
    label: "The hammer",
    blurb:
      "Last shot of the frame: no reply is coming, so exposure means nothing and pure placement wins. The engine, so cautious mid-frame, aims dead at the 10.",
    plan: (_board, opts) => scoreCandidates(opts),
    options: { shotNumber: 8, trials: 5 },
  },
];

const SHOOTER = { id: "y-shooter", color: YELLOW };

/** Evaluate a scenario's candidates and keep the best. */
function pickShot(scenario: Scenario): EvaluatedShot | null {
  const board = playbookBoards[scenario.id];
  const options: StrategyOptions = {
    color: YELLOW,
    trials: 8,
    rng: mulberry32(7),
    ...scenario.options,
  };
  let best: EvaluatedShot | null = null;
  for (const candidate of scenario.plan(board, resolveOptions(options))) {
    const value = evaluateShot(board, candidate, options);
    if (best === null || value > best.value) best = { candidate, value };
  }
  return best;
}

function LiveTotals({ discs }: { readonly discs: readonly Disc[] }) {
  const totals = [...frameScore(discs)].filter(
    ([color]) => color === YELLOW || color === BLACK,
  );
  if (totals.length === 0) return null;
  return (
    <Group gap={4}>
      {totals.map(([color, total]) => (
        <Text key={color} family="mono" size={0}>
          <DiscChip color={color} /> {formatScore(total)}
        </Text>
      ))}
    </Group>
  );
}

export const Playbook = ({ children }: React.PropsWithChildren) => {
  const [scenarioId, setScenarioId] =
    useState<keyof typeof playbookBoards>("kitchen");
  const scenario = SCENARIOS.find((s) => s.id === scenarioId)!;
  const { discs, settled, reset, shoot } = usePhysicsBoard();

  // The engine's pick for the selected scenario — Monte Carlo over that
  // tactic's candidates, seeded so the pick is stable.
  const pick = useMemo(() => pickShot(scenario), [scenario]);

  // Selecting a scenario swaps in its opening board; `reset` only touches
  // refs and state, so scenarioId is the real dependency.
  useEffect(() => {
    reset(playbookBoards[scenarioId]);
  }, [scenarioId]);

  const play = () => {
    if (!pick) return;
    reset(playbookBoards[scenarioId]);
    // The showcased shot is the engine's aim executed cleanly — evaluation
    // already priced in execution noise.
    shoot(pick.candidate, SHOOTER);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)] items-start gap-6">
      <Box
        data-slot="court"
        w={COURT_WIDTH}
        className="[&>svg]:block [&>svg]:w-full [&>svg]:h-auto"
      >
        <Diagram discs={discs} showLabels />
      </Box>
      <Stack gap={4} ax="stretch" className="min-w-0">
        <Group gap={2} className="flex-wrap">
          {SCENARIOS.map((s) => (
            <Button
              key={s.id}
              disabled={s.id === scenarioId}
              onClick={() => setScenarioId(s.id)}
            >
              {s.label}
            </Button>
          ))}
        </Group>
        <Text size={1} shade="muted" balance>
          {scenario.blurb}
        </Text>
        <Group gap={2}>
          <Button onClick={play} disabled={!pick || !settled}>
            Play the shot
          </Button>
          <Button onClick={() => reset(playbookBoards[scenarioId])}>
            Reset
          </Button>
        </Group>
        {pick ? (
          <Text family="mono" size={-1} shade="muted">
            engine pick: {pick.candidate.intent} · aim (
            {pick.candidate.aim.x.toFixed(0)}, {pick.candidate.aim.y.toFixed(0)}
            ) · value {pick.value.toFixed(1)}
          </Text>
        ) : null}
        <LiveTotals discs={discs} />
        {children}
      </Stack>
    </div>
  );
};

export const ExposureMeter = ({ children }: React.PropsWithChildren) => {
  const [guarded, setGuarded] = useState(false);
  const board = guarded ? [exposureScorer, exposureGuard] : [exposureScorer];

  const kitchen = kitchenExposure(exposureScorer, board, LEFT_STARTS);
  const clear = clearExposure(exposureScorer, board, LEFT_STARTS);
  const swing = 8 + 10; // their kitchen shot turns my +8 into −10

  return (
    <div className="grid grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)] items-start gap-6">
      <Box
        data-slot="court"
        w={COURT_WIDTH}
        className="[&>svg]:block [&>svg]:w-full [&>svg]:h-auto"
      >
        <Diagram
          discs={board}
          shooter={LEFT_STARTS[1]}
          showShadows
          showLabels
        />
      </Box>
      <Stack gap={4} ax="stretch" className="min-w-0">
        <Text size={1} shade="muted" balance>
          Is this disc safe? The yellow 8 scores — but every line from the
          opponent's kitchen slots (the marker at the foot of the court) runs
          straight through it toward the 10-off. kitchenExposure reads those lines
          geometrically: place the guard and every line is cut — the same
          8 points, no longer an {swing}-point swing waiting to happen.
        </Text>
        <Button onClick={() => setGuarded((g) => !g)}>
          {guarded ? "Remove the guard" : "Place the guard"}
        </Button>
        <Stack gap={1}>
          <Text family="mono" size={-1}>
            kitchenExposure: {(kitchen * 100).toFixed(0)}%{" "}
            {kitchen > 0 ? `→ risks a ${swing}-point swing` : "— safe"}
          </Text>
          <Text family="mono" size={-1}>
            clearExposure: {(clear * 100).toFixed(0)}%
          </Text>
        </Stack>
        {children}
      </Stack>
    </div>
  );
};
