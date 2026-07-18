import { Fragment } from "react";
import { Badge, Card, Separator, Stack, Text } from "@uiid/design-system";
import type { DocEntry, EntryKind, EntryRole } from "../lib/docs";
import { groupByKind, KIND_ORDER, roleOf } from "../lib/docs";
import type { ExampleMeta } from "../examples/registry";
import { examplesForSlug } from "../examples/registry";
import { Comment } from "./comment";
import { ExampleFrame } from "./example-frame";
import { Signature } from "./signature";

const KIND_LABEL: Record<EntryKind, string> = {
  function: "Functions",
  variable: "Constants",
  type: "Type Aliases",
  interface: "Interfaces",
  other: "Other",
};

const ROLE_COLOR: Record<
  EntryRole,
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "indigo"
  | "purple"
  | "neutral"
> = {
  function: "blue",
  component: "purple",
  constant: "yellow",
  type: "green",
  interface: "indigo",
  other: "neutral",
};

function EntryBlock({
  entry,
  examples,
}: {
  readonly entry: DocEntry;
  readonly examples: readonly ExampleMeta[];
}) {
  const role = roleOf(entry);
  return (
    <Card
      data-slot="entry-block"
      render={<section />}
      id={entry.slug}
      data-title={entry.name}
      ax="stretch"
      py={3}
      bb={1}
      gap={4}
      fullwidth
      title={entry.name}
      style={{ scrollMarginBlockStart: 80 }}
      description={<Comment parts={entry.description} />}
      InnerContainerProps={{ ax: "stretch" }}
      action={
        <Badge size="small" color={ROLE_COLOR[role]}>
          {role}
        </Badge>
      }
    >
      {entry.signature && <Signature code={entry.signature} />}
      {entry.kind === "type" && entry.shape && <Signature code={entry.shape} />}
      {examples.length > 0 && (
        <Stack gap={6} pt={4} ax="stretch" fullwidth>
          {examples.map((example, i) => (
            <Fragment key={example.id}>
              {i > 0 && <Separator my={6} />}
              <ExampleFrame example={example} />
            </Fragment>
          ))}
        </Stack>
      )}
    </Card>
  );
}

export function EntryList({
  entries,
}: {
  readonly entries: readonly DocEntry[];
}) {
  const groups = groupByKind(entries);

  // Assign each example to the first entry (in render order) whose slug it
  // matches, so a shared example renders once instead of duplicating under
  // every related entry — otherwise the page balloons with repeated SVGs and
  // highlighted code blocks.
  const rendered = new Set<string>();
  const examplesByEntry = new Map<string, ExampleMeta[]>();
  for (const kind of KIND_ORDER) {
    for (const entry of groups.get(kind) ?? []) {
      const fresh = examplesForSlug(entry.slug).filter(
        (e) => !rendered.has(e.id),
      );
      if (fresh.length === 0) continue;
      fresh.forEach((e) => rendered.add(e.id));
      examplesByEntry.set(entry.slug, fresh);
    }
  }

  return (
    <Stack data-slot="entry-list">
      {KIND_ORDER.flatMap((kind) => {
        const items = groups.get(kind);
        if (!items || items.length === 0) return [];
        return (
          <Stack key={kind} gap={4}>
            {items.map((entry) => (
              <EntryBlock
                key={entry.slug}
                entry={entry}
                examples={examplesByEntry.get(entry.slug) ?? []}
              />
            ))}
          </Stack>
        );
      })}
    </Stack>
  );
}
