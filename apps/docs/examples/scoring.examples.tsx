import { Diagram } from "@shuff/diagram";

import { cornerDiscs, sampleFrame, thresholdDiscs } from "./data";

export const SampleFrame = () => <Diagram discs={sampleFrame} showLabels />;

export const ThresholdCases = () => (
  <Diagram discs={thresholdDiscs} showLabels />
);

export const CornerDiscs = () => <Diagram discs={cornerDiscs} />;
