import { EntryList } from "../../components/entry-list";
import { coreDocs } from "../../lib/docs";
import { PageWrapper } from "../../components/page-wrapper";

export const metadata = {
  title: "@shuff/core — shuff docs",
};

export default function CorePage() {
  return (
    <PageWrapper
      title={coreDocs.pkg}
      description="Pure geometry, scoring, and rules math for shuffleboard. Framework-agnostic, zero runtime dependencies."
    >
      <EntryList entries={coreDocs.entries} />
    </PageWrapper>
  );
}
