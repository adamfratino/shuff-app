"use client";

import { useEffect, useRef, useState } from "react";
import {
  type Disc,
  DISC_RADIUS,
  HALF_COURT_LENGTH,
  HALF_COURT_WIDTH,
  type Point,
} from "@shuff/core";
import { DEFAULT_MU, type Shot } from "@shuff/motion";

/** Speed (in/s) below which a gliding disc is considered stopped. */
const STOP_THRESHOLD = 0.1;
/** Fixed physics step — the loop sub-steps to this for a stable curve. */
const SUB_DT = 1 / 240;
/** Clamp long rAF gaps (tab blur) so the disc never leaps a frame. */
const MAX_FRAME = 1 / 20;

type Sim = { x: number; y: number; vx: number; vy: number };

/**
 * Single-disc drift glide, integrated numerically. Where the collision hook
 * plays each glide as one analytic straight-line ease, a drifting disc's
 * heading changes every frame: Coulomb friction opposes the disc's *actual*
 * velocity while a constant `drift` acceleration (a tilted court's downhill
 * bias, in in/s²) bends the path. So the disc runs nearly true at speed and
 * hooks toward the low side as it slows — the shuffleboardjam.com behavior,
 * and why a real shot is aimed up-slope. No collisions: the drift example is
 * one disc against an open court, so this stays a small, self-contained
 * integrator and leaves usePhysicsBoard's analytic engine alone.
 */
export function useDriftBoard(mu: number = DEFAULT_MU) {
  const [disc, setDisc] = useState<Disc | null>(null);
  const [settled, setSettled] = useState(true);
  const simRef = useRef<Sim | null>(null);
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
      // Drift (external accel) first, then Coulomb friction opposing the
      // resulting velocity — capped so it can only bring the disc to rest,
      // never reverse it. Since drift < μ, speed decays to a clean stop.
      sim.vx += meta.drift.x * h;
      sim.vy += meta.drift.y * h;
      const s = Math.hypot(sim.vx, sim.vy);
      if (s < STOP_THRESHOLD) {
        sim.vx = 0;
        sim.vy = 0;
        return true;
      }
      const dec = Math.min(mu * h, s);
      sim.vx -= (sim.vx / s) * dec;
      sim.vy -= (sim.vy / s) * dec;
      sim.x += sim.vx * h;
      sim.y += sim.vy * h;
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
