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
  KITCHEN_DEPTH,
  type Point,
} from "@shuff/core";

import { COURT_WIDTH } from "./_shared";
import { glideDiscs } from "./data";

/**
 * Physics: Coulomb friction (constant deceleration) and perfectly elastic
 * equal-mass collisions — the model real shuffleboard sims use. Constant
 * deceleration is exactly a quadratic ease, so each motion segment maps
 * onto one Motion animation with an exact bezier, and a disc's velocity at
 * any instant falls out of the friction law analytically.
 */
const EASE_ACCEL: [number, number, number, number] = [0.33, 0, 0.67, 0.33]; // exact t²
const EASE_DECEL: [number, number, number, number] = [0.33, 0.67, 0.67, 1]; // exact 1-(1-t)²

type Segment = {
  dir: Point; // unit direction of travel
  v0: number; // peak speed, in/s
  startedAt: number; // performance.now() at segment start
  phase: "stroke" | "glide";
};

export const GlideToClick = ({ children }: React.PropsWithChildren) => {
  const [discs, setDiscs] = useState(glideDiscs);
  const discsRef = useRef(discs);
  const controlsRef = useRef(new Map<string, AnimationPlaybackControls>());
  const segRef = useRef(new Map<string, Segment>());

  // Friction: deceleration in in/s². This is the court-speed knob from
  // PLAN.md — lower is a faster (beaded) court.
  const MU = 160;

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

  /** Exact velocity of a disc right now, from its motion segment. */
  const velocityAt = (id: string): Point => {
    const seg = segRef.current.get(id);
    if (!seg) return { x: 0, y: 0 };
    const t = (performance.now() - seg.startedAt) / 1000;
    const strokeAccel = (seg.v0 * seg.v0) / (2 * KITCHEN_DEPTH);
    const speed =
      seg.phase === "stroke"
        ? Math.min(seg.v0, strokeAccel * t)
        : Math.max(0, seg.v0 - MU * t);
    return { x: seg.dir.x * speed, y: seg.dir.y * speed };
  };

  const run = (
    id: string,
    from: Point,
    to: Point,
    duration: number,
    ease: [number, number, number, number],
    onComplete?: () => void,
  ) => {
    controlsRef.current.set(
      id,
      animate(0, 1, {
        duration,
        ease,
        onUpdate: (t) => {
          const p = {
            x: from.x + (to.x - from.x) * t,
            y: from.y + (to.y - from.y) * t,
          };
          setDisc(id, resolveCollisions(id, p));
        },
        onComplete: onComplete ?? (() => segRef.current.delete(id)),
      }),
    );
  };

  /** Friction glide: stopping distance v²/2μ over duration v/μ. */
  const launch = (id: string, from: Point, v: Point) => {
    controlsRef.current.get(id)?.stop();
    segRef.current.delete(id);
    setDisc(id, from);
    const speed = Math.hypot(v.x, v.y);
    if (speed < 1) return; // effectively stopped
    const dir = { x: v.x / speed, y: v.y / speed };
    const glideLength = (speed * speed) / (2 * MU);
    // Rest positions clamp to the court for now — dead-disc removal
    // (sliding off the edge) is deferred to the replay phase.
    const to = clampToCourt({
      x: from.x + dir.x * glideLength,
      y: from.y + dir.y * glideLength,
    });
    segRef.current.set(id, {
      dir,
      v0: speed,
      startedAt: performance.now(),
      phase: "glide",
    });
    run(id, from, to, speed / MU, EASE_DECEL);
  };

  /**
   * One moving disc against every other. On contact the full normal
   * component of the relative velocity exchanges between the two discs
   * (perfectly elastic, equal masses): a dead-center hit stops the shooter
   * dead — the stick shot — and a glancing hit splits the motion between
   * them. Struck discs launch through the same machinery, so knock-ons
   * chain.
   */
  const resolveCollisions = (id: string, p: Point): Point => {
    for (const other of discsRef.current) {
      if (other.id === id || other.id === undefined) continue;
      const gap = distance(p, other);
      if (gap === 0 || gap >= DISC_DIAMETER) continue;
      const n = { x: (other.x - p.x) / gap, y: (other.y - p.y) / gap };
      const va = velocityAt(id);
      const vb = velocityAt(other.id);
      const dvn = (va.x - vb.x) * n.x + (va.y - vb.y) * n.y;
      if (dvn <= 0) continue; // touching but separating
      // Separate the overlap evenly, then exchange the normal component.
      const half = (DISC_DIAMETER - gap) / 2;
      const aPos = { x: p.x - n.x * half, y: p.y - n.y * half };
      const bPos = { x: other.x + n.x * half, y: other.y + n.y * half };
      launch(other.id, bPos, { x: vb.x + dvn * n.x, y: vb.y + dvn * n.y });
      launch(id, aPos, { x: va.x - dvn * n.x, y: va.y - dvn * n.y });
      return aPos;
    }
    return p;
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
    const dist = distance(from, target);
    if (dist < 1) return;
    const dir = { x: (target.x - from.x) / dist, y: (target.y - from.y) / dist };

    // Launch speed is chosen so friction brings the disc to rest exactly at
    // the click: v0 = √(2μ·d). The cue stroke is a real acceleration phase —
    // the disc ramps up over one kitchen depth (18 in) before release.
    if (dist <= KITCHEN_DEPTH * 1.5) {
      const v0 = Math.sqrt(2 * MU * dist);
      launch("y1", from, { x: dir.x * v0, y: dir.y * v0 });
      return;
    }
    const v0 = Math.sqrt(2 * MU * (dist - KITCHEN_DEPTH));
    const release = {
      x: from.x + dir.x * KITCHEN_DEPTH,
      y: from.y + dir.y * KITCHEN_DEPTH,
    };
    controlsRef.current.get("y1")?.stop();
    segRef.current.set("y1", {
      dir,
      v0,
      startedAt: performance.now(),
      phase: "stroke",
    });
    run("y1", from, release, (2 * KITCHEN_DEPTH) / v0, EASE_ACCEL, () =>
      launch("y1", release, { x: dir.x * v0, y: dir.y * v0 }),
    );
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
          the cue accelerates it through one kitchen depth, then friction
          brings it to rest exactly at the click. Zone tints and labels update
          mid-flight. Aim through a black disc to knock it: collisions are
          elastic between equal masses, so a dead-center hit stops the shooter
          dead (the stick shot) and a glancing hit splits the motion between
          both discs.
        </Text>
        {children}
      </Stack>
    </div>
  );
};
