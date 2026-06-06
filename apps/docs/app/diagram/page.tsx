import { Stack } from "@uiid/design-system";
import { Text } from "@uiid/design-system";
import { EntryList } from "../../components/entry-list";
import { diagramDocs } from "../../lib/docs";

export const metadata = {
  title: "@shuff/diagram — shuff docs",
};

export default function DiagramPage() {
  return (
    <Stack gap={4}>
      <Text size={2} weight="bold" family="mono">
        {diagramDocs.pkg}
      </Text>
      <Text size={0} shade="muted">
        React primitive that renders a shuffleboard half-court with discs at
        given coordinates. Pairs with @shuff/core.
      </Text>
      <EntryList entries={diagramDocs.entries} />
    </Stack>
  );
}
