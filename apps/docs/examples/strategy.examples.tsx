"use client";

import { useMemo, useState } from "react";
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

/** Seeded PRNG so each shot's engine pick is stable across renders. */
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

const SHOOTER = { id: "y-shooter", color: YELLOW };

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

type ShotSectionProps = React.PropsWithChildren<{
  /** Opening board for this shot — the position that makes it the right play. */
  board: readonly Disc[];
  /** Generates only this tactic's candidates; the engine picks among them. */
  plan: (
    board: readonly Disc[],
    options: ResolvedStrategyOptions,
  ) => ShotCandidate[];
  options?: Partial<StrategyOptions>;
}>;

/**
 * Shared body for every named-shot section: the engine evaluates the
 * tactic's candidates (Monte Carlo, seeded) and the physics engine plays
 * the winning shot on the court, with live totals as discs settle.
 */
function ShotSection({ board, plan, options, children }: ShotSectionProps) {
  const { discs, settled, reset, shoot } = usePhysicsBoard();
  const [played, setPlayed] = useState(false);

  const pick = useMemo<EvaluatedShot | null>(() => {
    const opts: StrategyOptions = {
      color: YELLOW,
      trials: 8,
      rng: mulberry32(7),
      ...options,
    };
    let best: EvaluatedShot | null = null;
    for (const candidate of plan(board, resolveOptions(opts))) {
      const value = evaluateShot(board, candidate, opts);
      if (best === null || value > best.value) best = { candidate, value };
    }
    return best;
  }, [board, plan, options]);

  // Until the first play, show the opening board directly; afterwards the
  // physics engine owns the disc positions.
  const shown = played ? discs : board;

  const play = () => {
    if (!pick) return;
    setPlayed(true);
    reset(board);
    // The showcased shot is the engine's aim executed cleanly — evaluation
    // already priced in execution noise.
    shoot(pick.candidate, SHOOTER);
  };

  const resetBoard = () => {
    setPlayed(false);
    reset(board);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)] items-start gap-6">
      <Box
        data-slot="court"
        w={COURT_WIDTH}
        className="[&>svg]:block [&>svg]:w-full [&>svg]:h-auto"
      >
        <Diagram discs={[...shown]} showLabels />
      </Box>
      <Stack gap={4} ax="stretch" className="min-w-0">
        <Group gap={2}>
          <Button onClick={play} disabled={!pick || !settled}>
            Play the shot
          </Button>
          <Button onClick={resetBoard}>Reset</Button>
        </Group>
        {pick ? (
          <Text family="mono" size={-1} shade="muted">
            engine pick: {pick.candidate.intent} · aim (
            {pick.candidate.aim.x.toFixed(0)}, {pick.candidate.aim.y.toFixed(0)}
            ) · value {pick.value.toFixed(1)}
          </Text>
        ) : null}
        <LiveTotals discs={shown} />
        {children}
      </Stack>
    </div>
  );
}

export const KitchenShot = ({ children }: React.PropsWithChildren) => (
  <ShotSection board={playbookBoards.kitchen} plan={kitchenCandidates}>
    {children}
  </ShotSection>
);

export const TheGuard = ({ children }: React.PropsWithChildren) => (
  <ShotSection board={playbookBoards.guard} plan={blockCandidates}>
    {children}
  </ShotSection>
);

export const TheSnuggle = ({ children }: React.PropsWithChildren) => (
  <ShotSection board={playbookBoards.snuggle} plan={snuggleCandidates}>
    {children}
  </ShotSection>
);

export const KitchenReplace = ({ children }: React.PropsWithChildren) => (
  <ShotSection
    board={playbookBoards["kitchen-replace"]}
    plan={kitchenReplaceCandidates}
  >
    {children}
  </ShotSection>
);

export const TheSweep = ({ children }: React.PropsWithChildren) => (
  <ShotSection board={playbookBoards.sweep} plan={sweepCandidates}>
    {children}
  </ShotSection>
);

const hammerPlan = (
  _board: readonly Disc[],
  options: ResolvedStrategyOptions,
) => scoreCandidates(options);
const HAMMER_OPTIONS: Partial<StrategyOptions> = { shotNumber: 8, trials: 5 };

export const TheHammer = ({ children }: React.PropsWithChildren) => (
  <ShotSection
    board={playbookBoards.hammer}
    plan={hammerPlan}
    options={HAMMER_OPTIONS}
  >
    {children}
  </ShotSection>
);

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
          straight through it toward the 10-off. kitchenExposure reads those
          lines geometrically: place the guard and every line is cut — the
          same 8 points, no longer an {swing}-point swing waiting to happen.
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
