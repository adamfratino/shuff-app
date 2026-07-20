"use client";

import { useEffect, useRef, useState } from "react";
import {
  type Disc,
  DISC_RADIUS,
  HALF_COURT_LENGTH,
  HALF_COURT_WIDTH,
  type Point,
} from "@shuff/core";
import {
  DEFAULT_MU,
  frictionStep,
  type Kinematic,
  type Shot,
} from "@shuff/motion";

/** Fixed physics step — the loop sub-steps to this for a stable curve. */
const SUB_DT = 1 / 240;
/** Clamp long rAF gaps (tab blur) so the disc never leaps a frame. */
const MAX_FRAME = 1 / 20;

/**
 * Single-disc drift glide, driven frame by frame off @shuff/motion's
 * `frictionStep` — the same primitive `simulateShot` steps with, so the live
 * animation and the packaged model are one source of truth. Where the
 * collision hook plays each glide as one analytic straight-line ease, a
 * drifting disc's heading changes every frame, so it can't be a single ease:
 * this rAF loop steps `frictionStep` to rest, exposing the curved path
 * `simulateShot` only reports the endpoint of. No collisions — the drift
 * example is one disc against an open court — so it stays small and leaves
 * usePhysicsBoard's analytic engine alone.
 */
export function useDriftBoard(mu: number = DEFAULT_MU) {
  const [disc, setDisc] = useState<Disc | null>(null);
  const [settled, setSettled] = useState(true);
  const simRef = useRef<Kinematic | null>(null);
  const metaRef = useRef<{ id: string; color: string; drift: Point } | null>(
    null,
  );
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);

  const stop = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  useEffect(() => stop, []);

  const reset = () => {
    stop();
    simRef.current = null;
    metaRef.current = null;
    setDisc(null);
    setSettled(true);
  };

  const isOffCourt = (p: Point) =>
    p.x < 0 || p.x > HALF_COURT_WIDTH || p.y < 0 || p.y > HALF_COURT_LENGTH;

  /** Advance the sim by `dt` seconds; returns true once the disc is at rest. */
  const step = (dt: number): boolean => {
    const sim = simRef.current;
    const meta = metaRef.current;
    if (!sim || !meta) return true;
    let remaining = dt;
    while (remaining > 0) {
      const h = Math.min(SUB_DT, remaining);
      remaining -= h;
      const next = frictionStep(sim, h, mu, meta.drift);
      sim.x = next.x;
      sim.y = next.y;
      sim.vx = next.vx;
      sim.vy = next.vy;
      if (sim.vx === 0 && sim.vy === 0) return true; // frictionStep parked it
      if (isOffCourt(sim)) return true;
    }
    return false;
  };

  const frameLoop = (now: number) => {
    const dt = Math.min((now - lastRef.current) / 1000, MAX_FRAME);
    lastRef.current = now;
    const done = step(dt);
    const sim = simRef.current;
    const meta = metaRef.current;
    if (sim && meta) {
      if (isOffCourt(sim)) {
        setDisc(null); // curved off the court — gone
      } else {
        setDisc({ id: meta.id, color: meta.color, x: sim.x, y: sim.y });
      }
    }
    if (done) {
      stop();
      setSettled(true);
    } else {
      rafRef.current = requestAnimationFrame(frameLoop);
    }
  };

  /**
   * Plays `shot` under a constant `drift` acceleration (in/s²). The shooter
   * appears at the shot's start already at launch speed; `drift` bends the
   * glide. Speed should be chosen for the *target* distance, not the aim —
   * that's what lets an up-slope aim curve back onto the spot.
   */
  const shoot = (
    shot: Shot,
    shooter: { id: string; color: string },
    drift: Point,
  ) => {
    stop();
    const start = {
      x: shot.start.x,
      y: Math.min(shot.start.y, HALF_COURT_LENGTH - DISC_RADIUS),
    };
    const dx = shot.aim.x - shot.start.x;
    const dy = shot.aim.y - shot.start.y;
    const len = Math.hypot(dx, dy);
    setDisc({ id: shooter.id, color: shooter.color, x: start.x, y: start.y });
    if (len < 1 || shot.speed <= 0) {
      setSettled(true);
      return;
    }
    simRef.current = {
      x: start.x,
      y: start.y,
      vx: (dx / len) * shot.speed,
      vy: (dy / len) * shot.speed,
    };
    metaRef.current = { id: shooter.id, color: shooter.color, drift };
    setSettled(false);
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(frameLoop);
  };

  const discs = disc ? [disc] : [];
  return { discs, settled, reset, shoot };
}
