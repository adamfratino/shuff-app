import { Box, CodeBlock, Stack, Text } from "@uiid/design-system";

import type { ExampleMeta } from "../examples/registry";
import { highlightCached } from "../lib/highlight";
import { readExportSource, readSnippetSource } from "../lib/source";
import { MockData } from "./mock-data";

function Heading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Stack gap={6}>
      <Text render={<h3 />} size={4} weight="semibold">
        {title}
      </Text>
      <Text size={1} shade="muted" balance>
        {description}
      </Text>
    </Stack>
  );
}

function SectionLabel({ children }: React.PropsWithChildren) {
  return (
    <Text render={<h4 />} size={1} weight="semibold" shade="muted">
      {children}
    </Text>
  );
}

/**
 * Frames a live example. Static examples use a two-column layout — the court in
 * a fixed-width left column, and the heading + data table + source in a details
 * column that owns the remaining width. The court column can't shrink and the
 * details column is `min-w-0`, so a wide code block scrolls instead of
 * collapsing the diagram. Interactive (`custom`) examples own their own body and
 * render full-width above the source.
 */
export async function ExampleFrame({ example }: { example: ExampleMeta }) {
  const {
    id,
    snippet,
    file,
    title,
    description,
    Visual,
    Aside,
    asideLabel,
    data,
    courtWidth,
    custom,
  } = example;
  const code = snippet
    ? await readSnippetSource(snippet)
    : await readExportSource(file, id);
  const html = code ? await highlightCached(code, "tsx") : undefined;

  const codeSection = code ? (
    <Stack gap={2} ax="stretch" minw={0}>
      <SectionLabel>Code</SectionLabel>
      <CodeBlock
        code={code}
        html={html}
        language="tsx"
        filename={snippet ? snippet.split("/").at(-1) : `${id}.tsx`}
        rows={12}
      />
      {data?.length ? <MockData data={data} /> : null}
    </Stack>
  ) : null;

  const asideSection = Aside ? (
    <Stack gap={2} ax="stretch" minw={0}>
      <SectionLabel>{asideLabel ?? "Result"}</SectionLabel>
      <Aside />
    </Stack>
  ) : null;

  if (custom) {
    return (
      <Stack
        data-slot="example"
        id={`example-${id}`}
        data-title={title}
        className="scroll-mt-16"
        ax="stretch"
        gap={6}
        fullwidth
      >
        <Heading title={title} description={description} />
        <Visual>{codeSection}</Visual>
      </Stack>
    );
  }

  return (
    <div
      data-slot="example"
      id={`example-${id}`}
      data-title={title}
      className="grid grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)] items-start gap-6 scroll-mt-16"
    >
      <Box
        data-slot="court"
        w={courtWidth}
        className="[&>svg]:block [&>svg]:w-full [&>svg]:h-auto"
      >
        <Visual />
      </Box>
      <Stack data-slot="example-details" ax="stretch" minw={0} gap={6}>
        <Heading title={title} description={description} />
        {codeSection}
        {asideSection}
      </Stack>
    </div>
  );
}
