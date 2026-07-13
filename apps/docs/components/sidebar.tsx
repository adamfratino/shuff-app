import Link from "next/link";
import { List, Stack, Text } from "@uiid/design-system";

import {
  SIDEBAR_WIDTH,
  SIDEBAR_SPACING,
  SHELL_BORDER_WIDTH,
  SIDEBAR_LIST_ITEM_SPACING,
} from "@/constants";
import { allDocs, groupByKind, KIND_ORDER } from "@/lib/docs";
import { SidebarCollapsible } from "@/components/sidebar-collapsible";

const ROUTE_BY_PKG: Record<string, string> = {
  "@shuff/core": "/core",
  "@shuff/diagram": "/diagram",
};

export function Sidebar() {
  return (
    <SidebarContainer>
      <SidebarScrollContainer>
        <SidebarHeader>shuff docs</SidebarHeader>
        {allDocs.map((pkg) => {
          const route = ROUTE_BY_PKG[pkg.pkg] ?? "/";
          const groups = groupByKind(pkg.entries);
          return (
            <Stack key={pkg.pkg} gap={3}>
              <Text size={0} weight="bold" render={<Link href={route} />}>
                {pkg.pkg}
              </Text>
              {KIND_ORDER.flatMap((kind) => {
                const items = groups.get(kind);
                if (!items || items.length === 0) return [];
                return (
                  <SidebarCollapsible key={kind} label={kind}>
                    <List
                      marker="none"
                      gap={SIDEBAR_LIST_ITEM_SPACING}
                      items={items.map((entry) => ({
                        value: entry.slug,
                        label: (
                          <Text render={<Link href={`${route}#${entry.slug}`} />}>
                            {entry.name}
                          </Text>
                        ),
                      }))}
                    />
                  </SidebarCollapsible>
                );
              })}
            </Stack>
          );
        })}
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
