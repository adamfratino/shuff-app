import { Stack, Text } from "@uiid/design-system";
import { EntryList } from "../../components/entry-list";
import { coreDocs } from "../../lib/docs";

export const metadata = {
  title: "@shuff/core — shuff docs",
};

export default function CorePage() {
  return (
    <Stack data-slot="page-content" gap={4} p={8} maxw={960}>
      <Stack mb={12} gap={4}>
        <Text size={2} weight="bold" family="mono">
          {coreDocs.pkg}
        </Text>
        <Text size={0} shade="muted">
          Pure geometry, scoring, and rules math for shuffleboard.
          Framework-agnostic, zero runtime dependencies.
        </Text>
      </Stack>
      <EntryList entries={coreDocs.entries} />
    </Stack>
  );
}
