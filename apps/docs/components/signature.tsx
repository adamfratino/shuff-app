import { Box, CardContainer } from "@uiid/design-system";
import type { SigToken } from "../lib/docs";
import { TypeTokens } from "./type-tokens";

export function Signature({ tokens }: { tokens: readonly SigToken[] }) {
  return (
    <CardContainer trimmed>
      <Box render={<pre />} p={3} m={0}>
        <TypeTokens tokens={tokens} />
      </Box>
    </CardContainer>
  );
}
