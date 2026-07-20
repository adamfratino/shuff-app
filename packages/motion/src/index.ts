export { diffBoards, type BoardDiff, type TransitionMove } from "./diff";
export {
  DEFAULT_MU,
  EASE_GLIDE,
  EASE_STROKE,
  EASE_TRAVEL,
  glideDuration,
  glideLength,
  launchSpeed,
} from "./physics";
export { frictionStep, simulateShot, type Kinematic } from "./simulate";
export type {
  BoardState,
  BoardTransitionOptions,
  Shot,
  ShotResult,
  SimulateShotOptions,
  TrackedDisc,
} from "./types";
export { useBoardTransition } from "./useBoardTransition";
