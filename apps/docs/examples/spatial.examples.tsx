import { Diagram } from "@shuff/diagram";

import {
  frameShooter,
  occlusionDiscs,
  occlusionShooter,
  sampleFrame,
} from "./data";

export const ShooterShadows = () => {
  return (
    <Diagram
      discs={sampleFrame}
      variant="full"
      shooter={frameShooter}
      showShadows
    />
  );
};

export const Spotlight = () => {
  return (
    <Diagram
      discs={sampleFrame}
      variant="full"
      shooter={frameShooter}
      showSpotlight
    />
  );
};

export const Occlusion = () => {
  return (
    <Diagram
      discs={occlusionDiscs}
      variant="full"
      shooter={occlusionShooter}
      showShadows
    />
  );
};
