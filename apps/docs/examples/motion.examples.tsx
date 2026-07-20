"use client";

import { useState } from "react";
import { Box, Button, CodeInline, Group, Stack, Text } from "@uiid/design-system";
import { Diagram } from "@shuff/diagram";
import {
  DISC_RADIUS,
  distance,
  HALF_COURT_LENGTH,
  HALF_COURT_WIDTH,
  type Point,
} from "@shuff/core";
import { launchSpeed, useBoardTransition } from "@shuff/motion";

import { COURT_WIDTH, YELLOW } from "./_shared";
import { collisionBoard, collisionTarget, diagramBoard } from "./data";
import { usePhysicsBoard } from "./use-physics-board";

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

export const Collisions = ({ children }: React.PropsWithChildren) => {
  const { discs, settled, reset, shoot } = usePhysicsBoard();
  const [played, setPlayed] = useState(false);

  const shown = played ? discs : collisionBoard;

  const fire = (offset: number) => {
    setPlayed(true);
    reset(collisionBoard);
    const x = collisionTarget.x + offset;
    const start = { x, y: HALF_COURT_LENGTH };
    shoot(
      {
        start,
        aim: { x, y: collisionTarget.y },
        speed: launchSpeed(distance(start, collisionTarget) + CARRY),
      },
      SHOOTER,
    );
  };

  const resetBoard = () => {
    setPlayed(false);
    reset(collisionBoard);
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
          <Button onClick={() => fire(0)} disabled={!settled}>
            Head-on
          </Button>
          <Button onClick={() => fire(5)} disabled={!settled}>
            Glancing
          </Button>
          <Button onClick={resetBoard}>Reset</Button>
        </Group>
        {children}
        <Text shade="muted" balance className="italic">
          A dead-center hit stops the shooter where it lands — the stick shot;
          a glancing hit splits the motion between both discs.
        </Text>
      </Stack>
    </div>
  );
};
