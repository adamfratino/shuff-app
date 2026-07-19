import Link from "next/link";
import { List, Stack, Text, Separator } from "@uiid/design-system";

import {
  SIDEBAR_WIDTH,
  SIDEBAR_SPACING,
  SHELL_BORDER_WIDTH,
  SIDEBAR_LIST_ITEM_SPACING,
} from "@/constants";
import { allDocs } from "@/lib/docs";

const ROUTE_BY_PKG: Record<string, string> = {
  "@shuff/core": "/core",
  "@shuff/diagram": "/diagram",
};

/**
 * One link per docs page: typedoc-driven packages first, then the packages
 * without a manifest yet (motion, strategy), listed statically. In-page
 * sections belong to the secondary sidebar (OnThisPage), not here.
 */
const PAGES: ReadonlyArray<{ label: string; href: string }> = [
  ...allDocs.map((pkg) => ({
    label: pkg.pkg,
    href: ROUTE_BY_PKG[pkg.pkg] ?? "/",
  })),
  { label: "@shuff/motion", href: "/motion" },
  { label: "@shuff/strategy", href: "/strategy" },
];

export function Sidebar() {
  return (
    <SidebarContainer>
      <SidebarScrollContainer>
        <SidebarHeader>shuff.app</SidebarHeader>
        <Separator />
        <List
          marker="none"
          gap={SIDEBAR_LIST_ITEM_SPACING}
          items={PAGES.map(({ label, href }) => ({
            label: (
              <Text size={0} weight="semibold" render={<Link href={href} />}>
                {label}
              </Text>
            ),
          }))}
        />
      </SidebarScrollContainer>
    </SidebarContainer>
  );
}

const SidebarContainer = ({ children }: React.PropsWithChildren) => {
  return (
    <Stack
      data-slot="sidebar"
      render={<aside />}
      maxw={SIDEBAR_WIDTH}
      br={SHELL_BORDER_WIDTH}
      ax="stretch"
      fullwidth
    >
      {children}
    </Stack>
  );
};
SidebarContainer.displayName = "SidebarContainer";

const SidebarScrollContainer = ({ children }: React.PropsWithChildren) => {
  return (
    <Stack
      data-slot="sidebar-scroll-container"
      className="sticky top-0 overflow-y-auto h-screen"
      ax="stretch"
      gap={SIDEBAR_SPACING}
      p={SIDEBAR_SPACING}
    >
      {children}
    </Stack>
  );
};
SidebarScrollContainer.displayName = "SidebarScrollContainer";

const SidebarHeader = ({ children }: React.PropsWithChildren) => {
  return (
    <Text data-slot="sidebar-header" weight="bold" size={3}>
      {children}
    </Text>
  );
};
SidebarHeader.displayName = "SidebarHeader";
