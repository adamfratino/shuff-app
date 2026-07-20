"use client";

import { useState } from "react";
import {
  Box,
  Button,
  type ButtonProps,
  CodeInline,
  Group,
  Stack,
  Switch,
  Text,
} from "@uiid/design-system";
import { PlayIcon, RotateCcwIcon } from "@uiid/icons";

import { Diagram } from "@shuff/diagram";
import {
  DISC_RADIUS,
  distance,
  HALF_COURT_LENGTH,
  HALF_COURT_WIDTH,
  type Point,
} from "@shuff/core";
import {
  launchSpeed,
  useBoardTransition,
  type TrackedDisc,
} from "@shuff/motion";

import { COURT_WIDTH, YELLOW } from "./_shared";
import {
  breakRack,
  caromBoard,
  collisionBoard,
  diagramBoard,
  driftGhost,
  driftTarget,
} from "./data";
import { usePhysicsBoard } from "./use-physics-board";
import { useDriftBoard } from "./use-drift-board";

/** Keep click targets on the court — a disc center stays a radius from every edge. */
const clampToCourt = (p: Point): Point => ({
  x: Math.min(Math.max(p.x, DISC_RADIUS), HALF_COURT_WIDTH - DISC_RADIUS),
  y: Math.min(Math.max(p.y, DISC_RADIUS), HALF_COURT_LENGTH - DISC_RADIUS),
});

// Interactive layer only — the shown code is snippets/basic-transition.tsx.
export const UseWithDiagram = ({ children }: React.PropsWithChildren) => {
  const [board, setBoard] = useState(diagramBoard);
  const discs = useBoardTransition(board);

  const handleCourtClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // The click target matches the SVG's aspect ratio, so client coordinates
    // map linearly onto court inches.
    const rect = event.currentTarget.getBoundingClientRect();
    const to = clampToCourt({
      x: ((event.clientX - rect.left) / rect.width) * HALF_COURT_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * HALF_COURT_LENGTH,
    });
    setBoard(board.map((d) => (d.id === "b1" ? { ...d, ...to } : d)));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)] items-start gap-6">
      <Box data-slot="court" w={COURT_WIDTH}>
        <div
          onClick={handleCourtClick}
          className="cursor-crosshair [&>svg]:block [&>svg]:w-full [&>svg]:h-auto"
        >
          <Diagram discs={discs} showLabels />
        </div>
      </Box>
      <Stack gap={4} ax="stretch" className="min-w-0">
        {children}
        <Text shade="muted" balance className="italic">
          Click the court and the disc glides there — each click just writes new
          board data. In the example above, this would be done using{" "}
          <CodeInline>setBoard</CodeInline>.
        </Text>
      </Stack>
    </div>
  );
};

const SHOOTER = { id: "y1", color: YELLOW };
const CARRY = 40; // glide handed to the struck disc — knocks the 8 into the 7
const CAROM_CARRY = 65; // glide budget telegraphed down the row of three
const BREAK_CARRY = 240; // full-power residual energy — scatters the whole pack

export const Collisions = ({ children }: React.PropsWithChildren) => {
  const { discs, settled, reset, shoot } = usePhysicsBoard();
  // The resting layout the buttons fire into — swapped per scenario so Reset
  // restores whichever one is on the court.
  const [board, setBoard] = useState<TrackedDisc[]>(collisionBoard);
  const [played, setPlayed] = useState(false);

  const shown = played ? discs : board;

  const fire = (next: TrackedDisc[], offset: number, carry: number) => {
    const [target] = next;
    if (!target) return;
    setBoard(next);
    setPlayed(true);
    reset(next);
    const x = target.x + offset;
    const start = { x, y: HALF_COURT_LENGTH };
    shoot(
      {
        start,
        aim: { x, y: target.y },
        speed: launchSpeed(distance(start, target) + carry),
      },
      SHOOTER,
    );
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
        {children}
        <Group gap={2}>
          <PlayButton
            onClick={() => fire(collisionBoard, 0, CARRY)}
            disabled={!settled}
          >
            Head-on
          </PlayButton>
          <PlayButton
            onClick={() => fire(collisionBoard, 5, CARRY)}
            disabled={!settled}
          >
            Glancing
          </PlayButton>
          <PlayButton
            onClick={() => fire(caromBoard, 0, CAROM_CARRY)}
            disabled={!settled}
          >
            Chain
          </PlayButton>
          <PlayButton
            onClick={() => fire(breakRack, 0, BREAK_CARRY)}
            disabled={!settled}
          >
            Break
          </PlayButton>
          <Button
            onClick={resetBoard}
            variant="ghost"
            size="small"
            tooltip="Reset board"
          >
            <RotateCcwIcon />
          </Button>
        </Group>
        <Text shade="muted" balance className="italic">
          The recipe above is the whole story for every button — only the board
          data differs. A dead-center hit stops the shooter where it lands (the
          stick shot); a glancing hit splits the motion between both discs;
          Chain telegraphs that same exchange down a row of three; Break drives
          a full rack apart in a cascade of knock-ons, off-court discs removed.
        </Text>
      </Stack>
    </div>
  );
};

const DRIFT_SHOOTER = { id: "y1", color: YELLOW };
const DRIFT_ACCEL = 32; // in/s² — a strong, unmistakable court bias
const COMP_OFFSET = 16; // aim this far up-slope so the hook curves onto the spot

export const Drift = ({ children }: React.PropsWithChildren) => {
  const { discs, settled, reset, shoot } = useDriftBoard();
  const [leansLeft, setLeansLeft] = useState(false);
  const dir = leansLeft ? -1 : 1; // +1 = court leans right, −1 = left

  // Same power every shot — chosen for the target distance, not the aim — so
  // the only variables are the court's bias and where you point.
  const start = { x: driftTarget.x, y: HALF_COURT_LENGTH - DISC_RADIUS };
  const speed = launchSpeed(distance(start, driftTarget));

  const fire = (aimX: number, biased: boolean) =>
    shoot(
      { start, aim: { x: aimX, y: driftTarget.y }, speed },
      DRIFT_SHOOTER,
      { x: biased ? DRIFT_ACCEL * dir : 0, y: 0 },
    );

  // Flipping which way the court leans clears the stale disc from the last run.
  const flip = (checked: boolean) => {
    setLeansLeft(checked);
    reset();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)] items-start gap-6">
      <Box
        data-slot="court"
        w={COURT_WIDTH}
        className="[&>svg]:block [&>svg]:w-full [&>svg]:h-auto"
      >
        <Diagram discs={[driftGhost, ...discs]} />
      </Box>
      <Stack gap={4} ax="stretch" className="min-w-0">
        {children}
        <Group gap={4} className="flex-wrap">
          <Switch
            label="Court leans left"
            checked={leansLeft}
            onCheckedChange={flip}
          />
        </Group>
        <Group gap={2}>
          <PlayButton
            onClick={() => fire(driftTarget.x, false)}
            disabled={!settled}
          >
            Straight
          </PlayButton>
          <PlayButton
            onClick={() => fire(driftTarget.x, true)}
            disabled={!settled}
          >
            Drift
          </PlayButton>
          <PlayButton
            onClick={() => fire(driftTarget.x - COMP_OFFSET * dir, true)}
            disabled={!settled}
          >
            Play it
          </PlayButton>
          <Button
            onClick={reset}
            variant="ghost"
            size="small"
            tooltip="Reset board"
          >
            <RotateCcwIcon />
          </Button>
        </Group>
        <Text shade="muted" balance className="italic">
          The gray spot is the target. On a level court (Straight) the disc
          runs true and covers it. Turn the bias on (Drift) with the same
          dead-on aim and the disc runs nearly straight at speed, then hooks
          off the low side as it slows — missing wide. Play it aims up-slope so
          the same curve carries the disc back onto the spot. Flip the switch
          to lean the court the other way.
        </Text>
      </Stack>
    </div>
  );
};

const PlayButton = ({ children, ...props }: ButtonProps) => (
  <Button variant="subtle" size="small" {...props}>
    <PlayIcon />
    {children}
  </Button>
);
