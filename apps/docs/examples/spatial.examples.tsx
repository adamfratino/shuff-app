import { Diagram } from "@shuff/diagram";

import { frameShooter, sampleFrame } from "./data";

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
