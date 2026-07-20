"use client";

import { useState } from "react";
import { Box, CodeInline, Stack, Text } from "@uiid/design-system";
import { Diagram } from "@shuff/diagram";
import {
  DISC_RADIUS,
  HALF_COURT_LENGTH,
  HALF_COURT_WIDTH,
  type Point,
} from "@shuff/core";
import { useBoardTransition } from "@shuff/motion";

import { COURT_WIDTH } from "./_shared";
import { diagramBoard } from "./data";

/** Keep click targets on the court — a disc center stays a radius from every edge. */
const clampToCourt = (p: Point): Point => ({
  x: Math.min(Math.max(p.x, DISC_RADIUS), HALF_COURT_WIDTH - DISC_RADIUS),
  y: Math.min(Math.max(p.y, DISC_RADIUS), HALF_COURT_LENGTH - DISC_RADIUS),
});

// The code block for this example is the self-contained snippet at
// snippets/basic-transition.tsx (see `snippet` in the registry); this
// component is only the interactive layer that illustrates it.
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
