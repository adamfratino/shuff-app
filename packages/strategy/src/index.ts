export {
  carrySpeed,
  distToSegment,
  exactSpeed,
  ghostBall,
  kitchenLanding,
} from "./aim";
export {
  allCandidates,
  blockCandidates,
  bumpCandidates,
  clearCandidates,
  kitchenCandidates,
  kitchenClearCandidates,
  kitchenReplaceCandidates,
  scoreCandidates,
  snuggleCandidates,
  sweepCandidates,
  tenBlockCandidates,
  ZONE_TARGETS,
} from "./candidates";
export {
  CLEAR_WEIGHT,
  DEFAULT_ANGLE_NOISE,
  DEFAULT_SPEED_NOISE,
  DEFAULT_TRIALS,
  HARD_FACTOR,
  KITCHEN_WEIGHT,
  LEFT_STARTS,
  resolveOptions,
  RIGHT_STARTS,
  SHOOTING_Y,
  SHOTS_PER_FRAME,
} from "./constants";
export { chooseShot, evaluateShot, rankShots } from "./evaluate";
export { clearExposure, kitchenExposure } from "./exposure";
export { simulateShot } from "./simulate";
export type {
  EvaluatedShot,
  Shot,
  ShotCandidate,
  ShotIntent,
  ShotResult,
  StrategyOptions,
} from "./types";
