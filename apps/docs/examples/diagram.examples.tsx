import { Stack, Table, Text } from "@uiid/design-system";
import { Diagram } from "@shuff/diagram";

import { DiscChip } from "./_shared";
import { COORD_PLOT_LEGEND, coordPlotDiscs, sampleFrame } from "./data";

export const HalfCourt = () => {
  return <Diagram discs={sampleFrame} />;
};

export const WithLabels = () => {
  return <Diagram discs={sampleFrame} showLabels />;
};

export const NeutralCourt = () => {
  return <Diagram discs={sampleFrame} highlightScoring={false} />;
};

export const CoordinatePlot = () => {
  return <Diagram discs={coordPlotDiscs} variant="full" />;
};

/** Companion legend for the CoordinatePlot example, shown in the details column. */
export const CoordinateLegend = () => {
  return (
    <Stack ax="stretch" fullwidth>
      <Table
        items={COORD_PLOT_LEGEND.map(({ y, color, label }) => ({
          Disc: <DiscChip color={color} />,
          y: (
            <Text family="mono" size={-1}>
              {y}
            </Text>
          ),
          Landmark: label,
        }))}
        bordered
        striped
      />
    </Stack>
  );
};
