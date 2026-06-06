import { Stack, CodeInline, Text } from "@uiid/design-system";
import type { DocEntry, EntryKind } from "../lib/docs";
import { groupByKind, KIND_ORDER } from "../lib/docs";
import { Comment } from "./comment";
import { ParamsTable } from "./params-table";
import { Signature } from "./signature";

const KIND_LABEL: Record<EntryKind, string> = {
  function: "Functions",
  variable: "Constants",
  type: "Type Aliases",
  interface: "Interfaces",
  other: "Other",
};

function EntryBlock({ entry }: { entry: DocEntry }) {
  return (
    <section
      id={entry.slug}
      style={{
        padding: "1rem 0",
        borderBottom: "1px solid var(--shade-accent, #eee)",
      }}
    >
      <Stack gap={2}>
        <Text size={2} weight="bold" family="mono">
          {entry.name}
        </Text>
        {entry.signature && <Signature code={entry.signature} />}
        {entry.kind === "type" && entry.shape && (
          <Signature code={`type ${entry.name} = ${entry.shape}`} />
        )}
        <Comment parts={entry.description} />
        {entry.kind === "function" && entry.parameters.length > 0 && (
          <ParamsTable params={entry.parameters} />
        )}
        {entry.kind === "function" && entry.returnType && (
          <Text size={-1} shade="muted">
            Returns <CodeInline>{entry.returnType}</CodeInline>
          </Text>
        )}
        {entry.sourceUrl && (
          <Text size={-1} shade="halftone">
            <a
              href={entry.sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              style={{ color: "inherit" }}
            >
              source
            </a>
          </Text>
        )}
      </Stack>
    </section>
  );
}

export function EntryList({ entries }: { entries: readonly DocEntry[] }) {
  const groups = groupByKind(entries);
  return (
    <Stack gap={4}>
      {KIND_ORDER.flatMap((kind) => {
        const items = groups.get(kind);
        if (!items || items.length === 0) return [];
        return (
          <Stack key={kind} gap={2}>
            <Text size={1} weight="bold">
              {KIND_LABEL[kind]}
            </Text>
            {items.map((entry) => (
              <EntryBlock key={entry.slug} entry={entry} />
            ))}
          </Stack>
        );
      })}
    </Stack>
  );
}
