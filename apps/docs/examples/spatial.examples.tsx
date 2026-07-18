import { Diagram } from "@shuff/diagram";

import {
  frameShooter,
  occlusionDiscs,
  occlusionShooter,
  sampleFrame,
} from "./data";

export const ShooterShadows = () => (
  <Diagram discs={sampleFrame} variant="full" shooter={frameShooter} showShadows />
);

export const Spotlight = () => (
  <Diagram
    discs={sampleFrame}
    variant="full"
    shooter={frameShooter}
    showSpotlight
  />
);

export const Occlusion = () => (
  <Diagram
    discs={occlusionDiscs}
    variant="full"
    shooter={occlusionShooter}
    showShadows
  />
);
