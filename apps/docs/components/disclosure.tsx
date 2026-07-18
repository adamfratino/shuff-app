"use client";

import { useState } from "react";
import { Group, Stack, Text } from "@uiid/design-system";

/**
 * A minimal collapsible disclosure — a label toggle that shows/hides its
 * children. Deliberately tiny (mirrors sidebar-collapsible) until we build a
 * richer code-block component. The children render as a sibling of the trigger
 * button, never inside it, so there's no nested-button markup.
 */
export function Disclosure({
  label,
  children,
}: React.PropsWithChildren<{ readonly label: string }>) {
  const [open, setOpen] = useState(false);

  return (
    <Stack gap={2} ax="stretch" minw={0}>
      <Group
        data-slot="disclosure-trigger"
        render={<button type="button" />}
        onClick={() => setOpen((prev) => !prev)}
        className="group cursor-pointer self-start"
        ay="center"
        gap={1}
      >
        <Text size={-1} shade="muted">
          {open ? "▾" : "▸"}
        </Text>
        <Text
          size={-1}
          shade="muted"
          weight="semibold"
          className="group-hover:underline"
        >
          {label}
        </Text>
      </Group>
      {open && children}
    </Stack>
  );
}
