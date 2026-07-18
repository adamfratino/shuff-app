import fs from "node:fs/promises";
import path from "node:path";

import { Box, CodeBlock, Stack, Text } from "@uiid/design-system";

import type { ExampleMeta } from "../examples/registry";
import { highlightCached } from "../lib/highlight";

const EXAMPLES_DIR = path.resolve(process.cwd(), "examples");
const EXPORT_PATTERN = /^export const /m;

/** Slices a single named export's source out of an examples file. */
async function getExampleSource(
  file: string,
  name: string,
): Promise<string | undefined> {
  const source = await fs.readFile(path.join(EXAMPLES_DIR, file), "utf-8");
  const start = source.search(new RegExp(`^export const ${name}\\b`, "m"));
  if (start === -1) return undefined;
  const rest = source.slice(start + 1);
  const nextExport = rest.search(EXPORT_PATTERN);
  const end = nextExport === -1 ? source.length : start + 1 + nextExport;
  return source.slice(start, end).trimEnd();
}

function Heading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Stack gap={3}>
      <Text render={<h3 />} size={4} weight="semibold">
        {title}
      </Text>
      <Text size={0} shade="muted">
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
  const { id, file, title, description, Visual, Aside, asideLabel, courtWidth, custom } =
    example;
  const code = await getExampleSource(file, id);
  const html = code ? await highlightCached(code, "tsx") : undefined;

  const codeSection = code ? (
    <Stack gap={2} ax="stretch" minw={0}>
      <SectionLabel>Code</SectionLabel>
      <CodeBlock
        code={code}
        html={html}
        language="tsx"
        filename={`${id}.tsx`}
        rows={12}
      />
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
        className="scroll-mt-16"
        ax="stretch"
        gap={6}
        fullwidth
      >
        <Heading title={title} description={description} />
        <Visual />
        {codeSection}
      </Stack>
    );
  }

  return (
    <div
      data-slot="example"
      id={`example-${id}`}
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
