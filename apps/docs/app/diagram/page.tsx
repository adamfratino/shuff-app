import { Stack, Text } from "@uiid/design-system";

import { EntryList } from "../../components/entry-list";
import { CourtGallery } from "../../components/court-gallery";
import { PropsTable } from "../../components/props-table";
import { diagramDocs } from "../../lib/docs";
import { PageWrapper } from "../../components/page-wrapper";

export const metadata = {
  title: "@shuff/diagram — shuff docs",
};

const PROPS_SLUG = "DiagramProps";

export default function DiagramPage() {
  const propsEntry = diagramDocs.entries.find((e) => e.slug === PROPS_SLUG);
  const entries = diagramDocs.entries.filter((e) => e.slug !== PROPS_SLUG);

  return (
    <PageWrapper
      title={diagramDocs.pkg}
      description="React primitive that renders a shuffleboard half- or full-court with discs at given coordinates."
    >
      {propsEntry && (
        <Stack data-slot="props" id={PROPS_SLUG} gap={3} ax="stretch" className="scroll-mt-16">
          <Text render={<h2 />} size={4} weight="semibold" family="mono">
            {propsEntry.name}
          </Text>
          <PropsTable entry={propsEntry} />
        </Stack>
      )}
      <CourtGallery />
      <EntryList entries={entries} />
    </PageWrapper>
  );
}
