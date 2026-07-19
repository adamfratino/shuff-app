"use client";

import { useEffect, useRef, useState } from "react";
import { animate, type AnimationPlaybackControls } from "motion";
import { Box, Stack, Text } from "@uiid/design-system";
import { Diagram } from "@shuff/diagram";
import {
  distance,
  HALF_COURT_LENGTH,
  HALF_COURT_WIDTH,
  type Point,
} from "@shuff/core";

import { COURT_WIDTH } from "./_shared";
import { glideDiscs } from "./data";

export const GlideToClick = ({ children }: React.PropsWithChildren) => {
  const [discs, setDiscs] = useState(glideDiscs);
  const discsRef = useRef(discs);
  const controlsRef = useRef<AnimationPlaybackControls | null>(null);

  useEffect(() => () => controlsRef.current?.stop(), []);

  const glideTo = (target: Point) => {
    controlsRef.current?.stop();
    const shot = discsRef.current.find((d) => d.id === "y1");
    if (!shot) return;
    const from = { x: shot.x, y: shot.y };

    // Friction feel: fast launch, long decaying glide, no overshoot — a cued
    // disc on a hard court doesn't bounce. Longer trips glide longer.
    controlsRef.current = animate(0, 1, {
      duration: 0.35 + (distance(from, target) / HALF_COURT_LENGTH) * 1.1,
      ease: [0.05, 0.65, 0.1, 1],
      onUpdate: (t) => {
        const next = discsRef.current.map((d) =>
          d.id === "y1"
            ? {
                ...d,
                x: from.x + (target.x - from.x) * t,
                y: from.y + (target.y - from.y) * t,
              }
            : d,
        );
        discsRef.current = next;
        setDiscs(next);
      },
    });
  };

  const handleCourtClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // The click target matches the SVG's aspect ratio, so client coordinates
    // map linearly onto court inches.
    const rect = event.currentTarget.getBoundingClientRect();
    glideTo({
      x: ((event.clientX - rect.left) / rect.width) * HALF_COURT_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * HALF_COURT_LENGTH,
    });
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
        <Text size={1} shade="muted" balance>
          Click anywhere on the court to send the yellow disc gliding there.
          Zone tints and its label update mid-flight; click again mid-glide to
          retarget from wherever it currently is.
        </Text>
        {children}
      </Stack>
    </div>
  );
};
