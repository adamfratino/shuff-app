import { Badge, Card, Stack, Text } from "@uiid/design-system";
import type { DocEntry, EntryKind, EntryRole } from "../lib/docs";
import { groupByKind, KIND_ORDER, roleOf } from "../lib/docs";
import { Comment } from "./comment";
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

function EntryBlock({ entry }: { readonly entry: DocEntry }) {
  const role = roleOf(entry);
  return (
    <Card
      data-slot="entry-block"
      render={<section />}
      id={entry.slug}
      ax="stretch"
      py={3}
      bb={1}
      gap={4}
      fullwidth
      title={entry.name}
      description={<Comment parts={entry.description} />}
      action={
        <Badge size="small" color={ROLE_COLOR[role]}>
          {role}
        </Badge>
      }
    >
      {entry.signature && <Signature code={entry.signature} />}
      {entry.kind === "type" && entry.shape && <Signature code={entry.shape} />}
    </Card>
  );
}

export function EntryList({
  entries,
}: {
  readonly entries: readonly DocEntry[];
}) {
  const groups = groupByKind(entries);
  return (
    <Stack data-slot="entry-list">
      {KIND_ORDER.flatMap((kind) => {
        const items = groups.get(kind);
        if (!items || items.length === 0) return [];
        return (
          <Stack key={kind} gap={4}>
            {items.map((entry) => (
              <EntryBlock key={entry.slug} entry={entry} />
            ))}
          </Stack>
        );
      })}
    </Stack>
  );
}
