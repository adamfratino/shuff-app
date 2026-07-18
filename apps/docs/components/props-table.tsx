import { Badge, Stack, Table, Text } from "@uiid/design-system";

import type { DocEntry } from "../lib/docs";
import { Comment } from "./comment";

/**
 * Renders a type/interface entry's members as a props table — name (with a `?`
 * for optional), type, and JSDoc description. Built from the TypeDoc data we
 * already ship, so no extra source parsing.
 */
export function PropsTable({ entry }: { readonly entry: DocEntry }) {
  const props = entry.props ?? [];
  if (props.length === 0) return null;

  const rows = props.map((prop) => ({
    Prop: (
      <Text family="mono" size={-1} color="orange">
        {prop.name}
        {prop.optional ? "?" : ""}
      </Text>
    ),
    Type: (
      <Badge size="small" color="blue">
        {prop.type}
      </Badge>
    ),
    Description: (
      <Text size={-1} shade="muted">
        {prop.description.length > 0 ? (
          <Comment parts={prop.description} />
        ) : (
          "—"
        )}
      </Text>
    ),
  }));

  return (
    <Stack
      className="overflow-auto [&_td]:align-top [&_th]:align-top"
      ax="stretch"
      fullwidth
    >
      <Table
        items={rows}
        bordered
        striped
        footer={
          <Text weight="bold" size={-1}>
            {rows.length} props
          </Text>
        }
      />
    </Stack>
  );
}
