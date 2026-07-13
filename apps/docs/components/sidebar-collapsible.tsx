"use client";

import { useState } from "react";
import { Group, Stack, Text } from "@uiid/design-system";

type SidebarCollapsibleProps = React.PropsWithChildren<{
  readonly label: string;
}>;

export function SidebarCollapsible({
  label,
  children,
}: SidebarCollapsibleProps) {
  const [open, setOpen] = useState(false);

  return (
    <Stack gap={1}>
      <Group
        data-slot="sidebar-collapsible-header"
        render={<button type="button" />}
        onClick={() => setOpen((prev) => !prev)}
        className="group cursor-pointer"
        ay="center"
        gap={1}
      >
        <Text size={-1} shade="muted" className="group-hover:underline">
          {label}
        </Text>
        <Text size={-1} shade="muted">
          {open ? "▾" : "▸"}
        </Text>
      </Group>
      {open && children}
    </Stack>
  );
}
