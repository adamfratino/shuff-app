import { useState } from "react";

import { Diagram } from "@shuff/diagram";
import {
  simulateShot,
  useBoardTransition,
  type Shot,
  type TrackedDisc,
} from "@shuff/motion";

// Any board — one disc or a full rack; simulateShot resolves whatever it hits.
const INITIAL_BOARD: TrackedDisc[] = [
  { id: "b1", x: 30, y: 72, color: "#1a1a1a" },
];
const SHOOTER = { id: "y1", color: "#f5c518" };

export const Collision = () => {
  const [board, setBoard] = useState(INITIAL_BOARD);
  const discs = useBoardTransition(board);

  const play = (shot: Shot) => {
    // simulateShot resolves every collision and returns the settled board
    const { board: settled } = simulateShot(board, shot, SHOOTER);
    setBoard(settled as TrackedDisc[]);
  };

  return <Diagram discs={discs} />;
};
