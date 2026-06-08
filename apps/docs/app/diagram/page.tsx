import { Stack, Text } from "@uiid/design-system";

import { EntryList } from "../../components/entry-list";
import { diagramDocs } from "../../lib/docs";
import { PageWrapper } from "../../components/page-wrapper";

export const metadata = {
  title: "@shuff/diagram — shuff docs",
};

export default function DiagramPage() {
  return (
    <PageWrapper
      title={diagramDocs.pkg}
      description="React primitive that renders a shuffleboard half-court with discs at given coordinates. Pairs with @shuff/core."
    >
      <EntryList entries={diagramDocs.entries} />
    </PageWrapper>
  );
}
