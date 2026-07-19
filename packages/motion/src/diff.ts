import { type Point, distance } from "@shuff/core";

import type { BoardState, TrackedDisc } from "./types";

/** One disc's repositioning between two board states. */
export type TransitionMove = {
  id: string;
  from: Point;
  to: Point;
};

export type BoardDiff = {
  /** Discs present in the target but not the current state. */
  added: TrackedDisc[];
  /** Ids present in the current state but not the target. */
  removedIds: string[];
  /** Discs present in both whose position changed. */
  moves: TransitionMove[];
};

/** Positions closer than this (inches) are treated as unmoved. */
const EPSILON = 0.001;

/**
 * Id-based diff between two board states. Color or z-order changes alone
 * are not moves — consumers apply the target's roster, order, and styling
 * directly and animate only the position changes.
 */
export function diffBoards(current: BoardState, target: BoardState): BoardDiff {
  const currentById = new Map(current.map((d) => [d.id, d]));
  const targetIds = new Set(target.map((d) => d.id));

  const added: TrackedDisc[] = [];
  const moves: TransitionMove[] = [];

  for (const t of target) {
    const cur = currentById.get(t.id);
    if (!cur) {
      added.push(t);
      continue;
    }
    if (distance(cur, t) > EPSILON) {
      moves.push({
        id: t.id,
        from: { x: cur.x, y: cur.y },
        to: { x: t.x, y: t.y },
      });
    }
  }

  const removedIds = current
    .filter((d) => !targetIds.has(d.id))
    .map((d) => d.id);

  return { added, removedIds, moves };
}
