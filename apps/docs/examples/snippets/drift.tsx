import { useState } from "react";

import { Diagram } from "@shuff/diagram";
import {
  simulateShot,
  useBoardTransition,
  type Shot,
  type TrackedDisc,
} from "@shuff/motion";

// Outdoor courts lean. Pass a constant drift (in/s²) and simulateShot plays
// the shot through it: friction fights the disc's real velocity, so the bias
// tells as it slows and the disc settles off the low side — aim up-slope.
const DRIFT = { x: 32, y: 0 }; // the court leans right
const SHOOTER = { id: "y1", color: "#f5c518" };

export const Drift = () => {
  const [board, setBoard] = useState<TrackedDisc[]>([]);
  const discs = useBoardTransition(board);

  const play = (shot: Shot) => {
    // Same call as a level court, plus the court's bias
    const { board: settled } = simulateShot([], shot, SHOOTER, { drift: DRIFT });
    setBoard(settled as TrackedDisc[]);
  };

  return <Diagram discs={discs} />;
};
