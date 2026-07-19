"use client";

import { useEffect, useRef, useState } from "react";
import { animate, type AnimationPlaybackControls } from "motion";
import {
  type Disc,
  DISC_DIAMETER,
  DISC_RADIUS,
  distance,
  HALF_COURT_LENGTH,
  HALF_COURT_WIDTH,
  type Point,
} from "@shuff/core";
import { DEFAULT_MU, EASE_GLIDE } from "@shuff/motion";
import type { Shot } from "@shuff/strategy";

type Segment = {
  dir: Point; // unit direction of travel
  v0: number; // speed at segment start, in/s
  startedAt: number; // performance.now() at segment start
};

/**
 * The glide-example physics engine (Coulomb friction glides as exact
 * quadratic-ease Motion animations, equal-mass elastic collisions resolved
 * per frame) packaged as a hook, with one addition: discs that leave the
 * court are removed from the board mid-flight — clears and kitchen rescues
 * need discs to actually die.
 *
 * `shoot` plays a `@shuff/strategy` Shot: the shooter's disc appears at the
 * shot's start (the kitchen slot at y = 230, just inside the rendered
 * half-court) already at launch speed — from the target end's point of
 * view, that's what an incoming shot looks like.
 */
export function usePhysicsBoard(mu: number = DEFAULT_MU) {
  const [discs, setDiscs] = useState<Disc[]>([]);
  const [settled, setSettled] = useState(true);
  const discsRef = useRef<Disc[]>([]);
  const controlsRef = useRef(new Map<string, AnimationPlaybackControls>());
  const segRef = useRef(new Map<string, Segment>());

  useEffect(
    () => () => {
      for (const controls of controlsRef.current.values()) controls.stop();
    },
    [],
  );

  const commit = (next: Disc[]) => {
    discsRef.current = next;
    setDiscs(next);
  };

  const finish = (id: string) => {
    controlsRef.current.delete(id);
    segRef.current.delete(id);
    if (controlsRef.current.size === 0) setSettled(true);
  };

  const reset = (board: readonly Disc[]) => {
    for (const controls of controlsRef.current.values()) controls.stop();
    controlsRef.current.clear();
    segRef.current.clear();
    commit(board.map((d) => ({ ...d })));
    setSettled(true);
  };

  const setDisc = (id: string, p: Point) => {
    commit(
      discsRef.current.map((d) => (d.id === id ? { ...d, x: p.x, y: p.y } : d)),
    );
  };

  /** A disc whose center crosses the court boundary is gone. */
  const isOffCourt = (p: Point) =>
    p.x < 0 || p.x > HALF_COURT_WIDTH || p.y < 0 || p.y > HALF_COURT_LENGTH;

  const removeDisc = (id: string) => {
    controlsRef.current.get(id)?.stop();
    finish(id);
    commit(discsRef.current.filter((d) => d.id !== id));
  };

  /** Exact velocity of a disc right now, from its glide segment. */
  const velocityAt = (id: string): Point => {
    const seg = segRef.current.get(id);
    if (!seg) return { x: 0, y: 0 };
    const t = (performance.now() - seg.startedAt) / 1000;
    const speed = Math.max(0, seg.v0 - mu * t);
    return { x: seg.dir.x * speed, y: seg.dir.y * speed };
  };

  /** Friction glide: stopping distance v²/2μ over duration v/μ. */
  const launch = (id: string, from: Point, v: Point) => {
    controlsRef.current.get(id)?.stop();
    segRef.current.delete(id);
    setDisc(id, from);
    const speed = Math.hypot(v.x, v.y);
    if (speed < 1) {
      finish(id);
      return;
    }
    const dir = { x: v.x / speed, y: v.y / speed };
    const glideLength = (speed * speed) / (2 * mu);
    const to = {
      x: from.x + dir.x * glideLength,
      y: from.y + dir.y * glideLength,
    };
    segRef.current.set(id, { dir, v0: speed, startedAt: performance.now() });
    controlsRef.current.set(
      id,
      animate(0, 1, {
        duration: speed / mu,
        ease: EASE_GLIDE,
        onUpdate: (t) => {
          const p = {
            x: from.x + (to.x - from.x) * t,
            y: from.y + (to.y - from.y) * t,
          };
          const resolved = resolveCollisions(id, p);
          if (isOffCourt(resolved)) {
            removeDisc(id);
          } else {
            setDisc(id, resolved);
          }
        },
        onComplete: () => finish(id),
      }),
    );
  };

  /**
   * One moving disc against every other: on contact the full normal
   * component of relative velocity exchanges (perfectly elastic, equal
   * masses) — stick shots, glancing splits, and chained knock-ons fall out.
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
      const half = (DISC_DIAMETER - gap) / 2;
      const aPos = { x: p.x - n.x * half, y: p.y - n.y * half };
      const bPos = { x: other.x + n.x * half, y: other.y + n.y * half };
      launch(other.id, bPos, { x: vb.x + dvn * n.x, y: vb.y + dvn * n.y });
      launch(id, aPos, { x: va.x - dvn * n.x, y: va.y - dvn * n.y });
      return aPos;
    }
    return p;
  };

  const shoot = (shot: Shot, shooter: { id: string; color: string }) => {
    const start = {
      x: shot.start.x,
      // Keep the staged disc fully inside the rendered half-court.
      y: Math.min(shot.start.y, HALF_COURT_LENGTH - DISC_RADIUS),
    };
    commit([
      ...discsRef.current.filter((d) => d.id !== shooter.id),
      { ...shooter, x: start.x, y: start.y },
    ]);
    setSettled(false);
    const dx = shot.aim.x - shot.start.x;
    const dy = shot.aim.y - shot.start.y;
    const len = Math.hypot(dx, dy);
    if (len < 1) return;
    launch(shooter.id, start, {
      x: (dx / len) * shot.speed,
      y: (dy / len) * shot.speed,
    });
  };

  return { discs, settled, reset, shoot };
}
