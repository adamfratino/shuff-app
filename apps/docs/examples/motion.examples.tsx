"use client";

import { useEffect, useRef, useState } from "react";
import { animate, type AnimationPlaybackControls } from "motion";
import { Box, Stack, Text } from "@uiid/design-system";
import { Diagram } from "@shuff/diagram";
import {
  DISC_DIAMETER,
  DISC_RADIUS,
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
  const controlsRef = useRef(new Map<string, AnimationPlaybackControls>());
  // Last observed position + timestamp per moving disc → velocity at contact.
  const trackRef = useRef(new Map<string, { p: Point; at: number }>());

  useEffect(
    () => () => {
      for (const controls of controlsRef.current.values()) controls.stop();
    },
    [],
  );

  const setDisc = (id: string, p: Point) => {
    const next = discsRef.current.map((d) =>
      d.id === id ? { ...d, x: p.x, y: p.y } : d,
    );
    discsRef.current = next;
    setDiscs(next);
  };

  const clampToCourt = (p: Point): Point => ({
    x: Math.min(Math.max(p.x, DISC_RADIUS), HALF_COURT_WIDTH - DISC_RADIUS),
    y: Math.min(Math.max(p.y, DISC_RADIUS), HALF_COURT_LENGTH - DISC_RADIUS),
  });

  /** Track a moving disc's position and return its velocity in inches/sec. */
  const velocityOf = (id: string, p: Point): Point => {
    const prev = trackRef.current.get(id);
    const at = performance.now();
    trackRef.current.set(id, { p, at });
    if (!prev || at <= prev.at) return { x: 0, y: 0 };
    const dt = (at - prev.at) / 1000;
    return { x: (p.x - prev.p.x) / dt, y: (p.y - prev.p.y) / dt };
  };

  /**
   * One moving disc against every other disc (treated as resting). On
   * contact, most of the velocity component along the line of centers
   * transfers to the struck disc (equal masses, imperfect restitution) and
   * the tangential component stays with the mover — so a dead-center hit
   * near-stops the shooter (the stick shot) while a glancing hit deflects
   * it aside. Struck discs launch through the same machinery, so knock-ons
   * chain.
   */
  const resolveCollisions = (id: string, p: Point, v: Point): Point => {
    for (const other of discsRef.current) {
      if (other.id === id || other.id === undefined) continue;
      const gap = distance(p, other);
      if (gap === 0 || gap >= DISC_DIAMETER) continue;
      const n = { x: (other.x - p.x) / gap, y: (other.y - p.y) / gap };
      const speedAlongCenters = v.x * n.x + v.y * n.y;
      if (speedAlongCenters <= 0) continue; // touching but separating
      controlsRef.current.get(id)?.stop();
      // Back the mover off to exactly touching before splitting the velocity.
      const touch = {
        x: other.x - n.x * DISC_DIAMETER,
        y: other.y - n.y * DISC_DIAMETER,
      };
      // Biscuits aren't perfectly elastic — the contact absorbs some of the
      // energy (restitution ≈ 0.6), so the struck disc takes 80% of the
      // approach speed and the shooter keeps a touch of follow-through
      // instead of a dead stop.
      const transferred = 0.8 * speedAlongCenters;
      launch(
        other.id,
        { x: other.x, y: other.y },
        { x: n.x * transferred, y: n.y * transferred },
      );
      launch(id, touch, {
        x: v.x - n.x * transferred,
        y: v.y - n.y * transferred,
      });
      return touch;
    }
    return p;
  };

  /** A struck disc departs at contact speed and glides friction-out to rest. */
  const launch = (id: string, from: Point, v: Point) => {
    controlsRef.current.get(id)?.stop();
    const speed = Math.hypot(v.x, v.y);
    if (speed < 10) return; // slower than ~10 in/s: it just settles
    const glideLength = speed * 0.32; // court friction: inches per in/s
    const to = clampToCourt({
      x: from.x + (v.x / speed) * glideLength,
      y: from.y + (v.y / speed) * glideLength,
    });
    // Full speed off the contact, then a long lazy decay — knocked discs
    // bleed speed gradually, they don't brake.
    glide(id, from, to, {
      duration: (2 * glideLength) / speed,
      ease: [0, 0.55, 0.15, 1],
    });
  };

  const glide = (
    id: string,
    from: Point,
    to: Point,
    transition: {
      duration: number;
      ease: [number, number, number, number];
    },
  ) => {
    trackRef.current.set(id, { p: from, at: performance.now() });
    controlsRef.current.set(
      id,
      animate(0, 1, {
        ...transition,
        onUpdate: (t) => {
          const p = {
            x: from.x + (to.x - from.x) * t,
            y: from.y + (to.y - from.y) * t,
          };
          setDisc(id, resolveCollisions(id, p, velocityOf(id, p)));
        },
      }),
    );
  };

  const handleCourtClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // The click target matches the SVG's aspect ratio, so client coordinates
    // map linearly onto court inches.
    const rect = event.currentTarget.getBoundingClientRect();
    const target = {
      x: ((event.clientX - rect.left) / rect.width) * HALF_COURT_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * HALF_COURT_LENGTH,
    };
    const shot = discsRef.current.find((d) => d.id === "y1");
    if (!shot) return;
    const from = { x: shot.x, y: shot.y };
    // Friction feel: the cue accelerates the disc through the stroke — a
    // gentle ramp-up, not an instant launch — then it decelerates in a long
    // glide to a stop. No overshoot: a cued disc on a hard court doesn't
    // bounce. Longer trips glide longer.
    glide("y1", from, target, {
      duration: 0.45 + (distance(from, target) / HALF_COURT_LENGTH) * 1.1,
      ease: [0.23, 0.25, 0.15, 1],
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
          Click anywhere on the court to send the yellow disc gliding there —
          zone tints and labels update mid-flight, and clicking again mid-glide
          retargets it. Aim through a black disc to knock it: momentum
          transfers along the line of centers, so a dead-center hit mostly
          sticks the shooter and a glancing hit deflects both discs.
        </Text>
        {children}
      </Stack>
    </div>
  );
};
