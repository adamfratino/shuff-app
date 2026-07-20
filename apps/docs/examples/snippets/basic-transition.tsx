import { useState } from "react";

import { Diagram } from "@shuff/diagram";
import { useBoardTransition, type TrackedDisc } from "@shuff/motion";

const INITIAL_BOARD: TrackedDisc[] = [
  { id: "b1", x: 24, y: 60, color: "#1a1a1a" },
];

export const BasicTransition = () => {
  const [board, setBoard] = useState(INITIAL_BOARD);
  const discs = useBoardTransition(board);

  return <Diagram discs={discs} />;
};
