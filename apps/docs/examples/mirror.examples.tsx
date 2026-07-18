"use client";

import { useState } from "react";
import { Box, Checkbox, Group, Stack, Text } from "@uiid/design-system";
import { Diagram } from "@shuff/diagram";
import { type Disc, frameScore, mirrorEnd, mirrorSide } from "@shuff/core";

import { COURT_WIDTH, DiscChip, formatScore } from "./_shared";
import { sampleFrame } from "./data";

export const MirrorTransforms = () => {
  const [end, setEnd] = useState(false);
  const [side, setSide] = useState(false);

  let discs: Disc[] = sampleFrame;
  if (end) discs = discs.map(mirrorEnd);
  if (side) discs = discs.map(mirrorSide);

  const totals = frameScore(discs);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)] items-start gap-6">
      <Box
        data-slot="court"
        w={COURT_WIDTH}
        className="[&>svg]:block [&>svg]:w-full [&>svg]:h-auto"
      >
        <Diagram discs={discs} variant="full" />
      </Box>
      <Stack gap={4} ax="stretch" className="min-w-0">
        <Group gap={4} className="flex-wrap">
          <Checkbox
            label="mirrorEnd (flip y)"
            checked={end}
            onCheckedChange={(checked) => setEnd(checked)}
          />
          <Checkbox
            label="mirrorSide (flip x)"
            checked={side}
            onCheckedChange={(checked) => setSide(checked)}
          />
        </Group>
        <Stack gap={2}>
          <Text render={<h4 />} size={1} weight="semibold">
            Totals
          </Text>
          {[...totals].map(([color, total]) => (
            <Text key={color} family="mono" size={-1}>
              <DiscChip color={color} /> {formatScore(total)}
            </Text>
          ))}
        </Stack>
      </Stack>
    </div>
  );
};
