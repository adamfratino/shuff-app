"use client";

import { Diagram, type DiagramProps } from "@shuff/diagram";

import type { BoardState, BoardTransitionOptions } from "./types";
import { useBoardTransition } from "./useBoardTransition";

export type AnimatedDiagramProps = Omit<DiagramProps, "discs"> &
  BoardTransitionOptions & {
    /**
     * Discs to render, each with a required stable `id`. Whenever this
     * changes, discs glide from their current positions to the new ones.
     */
    discs?: BoardState;
  };

/**
 * Drop-in `<Diagram>` that animates disc changes. All other DiagramProps
 * pass straight through; the underlying Diagram stays animation-unaware
 * and re-renders from in-flight data each frame.
 */
export function AnimatedDiagram({
  discs = [],
  courtSpeed,
  reducedMotion,
  ...diagramProps
}: AnimatedDiagramProps) {
  const rendered = useBoardTransition(discs, { courtSpeed, reducedMotion });
  return <Diagram discs={rendered} {...diagramProps} />;
}
