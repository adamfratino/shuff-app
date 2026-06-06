import { Stack } from "@uiid/design-system";
import { Text } from "@uiid/design-system";
import { EntryList } from "../../components/entry-list";
import { coreDocs } from "../../lib/docs";

export const metadata = {
  title: "@shuff/core — shuff docs",
};

export default function CorePage() {
  return (
    <Stack gap={4}>
      <Text size={2} weight="bold" mono>
        {coreDocs.pkg}
      </Text>
      <Text size={0} shade="muted">
        Pure geometry, scoring, and rules math for shuffleboard.
        Framework-agnostic, zero runtime dependencies.
      </Text>
      <EntryList entries={coreDocs.entries} />
    </Stack>
  );
}
