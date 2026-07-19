"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate, type AnimationPlaybackControls } from "motion";
import { useReducedMotion } from "motion/react";
import type { Point } from "@shuff/core";

import { diffBoards } from "./diff";
import { EASE_TRAVEL, glideDuration } from "./physics";
import type { BoardState, BoardTransitionOptions, TrackedDisc } from "./types";

/**
 * The state-to-state transition primitive: give it a target board and it
 * returns the in-flight one. Whenever the target changes, discs glide from
 * wherever they currently are to their new positions with friction-derived
 * durations; retargeting mid-flight continues from the in-flight position.
 * Added discs appear at their target position, removed discs drop
 * immediately — enter/exit choreography is a later phase.
 *
 * Everything derived from position (zone tints, labels, shadows) stays
 * correct mid-flight because consumers re-render `<Diagram>` from the
 * returned data each frame.
 */
export function useBoardTransition(
  target: BoardState,
  options?: BoardTransitionOptions,
): TrackedDisc[] {
  const mu = options?.courtSpeed;
  const systemReduced = useReducedMotion();
  const reduced = options?.reducedMotion ?? systemReduced ?? false;

  const [rendered, setRendered] = useState<TrackedDisc[]>(() =>
    target.map((d) => ({ ...d })),
  );
  const renderedRef = useRef(rendered);
  const controlsRef = useRef(new Map<string, AnimationPlaybackControls>());

  // Re-run the transition effect on content changes, not array identity —
  // callers may build the target inline every render.
  const signature = useMemo(
    () => target.map((d) => `${d.id}:${d.x}:${d.y}:${d.color}`).join("|"),
    [target],
  );

  useEffect(
    () => () => {
      for (const controls of controlsRef.current.values()) controls.stop();
    },
    [],
  );

  useEffect(() => {
    const current = renderedRef.current;
    const { moves, removedIds } = diffBoards(current, target);

    for (const id of removedIds) {
      controlsRef.current.get(id)?.stop();
      controlsRef.current.delete(id);
    }

    // Adopt the target's roster, z-order, and styling immediately; moving
    // discs keep their in-flight position until their glide updates it.
    const moveById = new Map(moves.map((m) => [m.id, m]));
    const next = target.map((t) => {
      const move = moveById.get(t.id);
      return move ? { ...t, x: move.from.x, y: move.from.y } : { ...t };
    });
    renderedRef.current = next;
    setRendered(next);

    const setDisc = (id: string, p: Point) => {
      const updated = renderedRef.current.map((d) =>
        d.id === id ? { ...d, x: p.x, y: p.y } : d,
      );
      renderedRef.current = updated;
      setRendered(updated);
    };

    for (const { id, from, to } of moves) {
      controlsRef.current.get(id)?.stop();
      if (reduced) {
        setDisc(id, to);
        continue;
      }
      const dist = Math.hypot(to.x - from.x, to.y - from.y);
      controlsRef.current.set(
        id,
        animate(0, 1, {
          duration: glideDuration(dist, mu),
          ease: EASE_TRAVEL,
          onUpdate: (t) => {
            setDisc(id, {
              x: from.x + (to.x - from.x) * t,
              y: from.y + (to.y - from.y) * t,
            });
          },
          onComplete: () => controlsRef.current.delete(id),
        }),
      );
    }
    // Deliberately keyed on `signature`, not `target`: identity changes
    // without content changes must not restart glides.
  }, [signature, mu, reduced]);

  return rendered;
}
