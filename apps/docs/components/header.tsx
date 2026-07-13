"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Breadcrumbs, Group } from "@uiid/design-system";

import { SHELL_SPACING, SHELL_BORDER_WIDTH, SITE_TITLE } from "@/constants";
import { SITEMAP } from "@/sitemap";

export function Header() {
  return (
    <HeaderContainer>
      <HeaderBreadcrumbs />
    </HeaderContainer>
  );
}

const HeaderContainer = ({ children }: React.PropsWithChildren) => {
  return (
    <Group
      data-slot="header-container"
      render={<header />}
      className="sticky top-0 bg-(--shade-background) z-1"
      ay="center"
      gap={SHELL_SPACING}
      p={SHELL_SPACING}
      bb={SHELL_BORDER_WIDTH}
      fullwidth
    >
      {children}
    </Group>
  );
};
HeaderContainer.displayName = "HeaderContainer";

const HeaderBreadcrumbs = () => {
  const pathname = usePathname();
  const active = SITEMAP.find((item) => pathname.startsWith(item.value));

  const items = [
    { label: SITE_TITLE, value: "/" },
    ...(active ? [{ label: active.label, value: active.value }] : []),
  ];

  return (
    <Breadcrumbs data-slot="header-breadcrumbs" items={items} linkAs={Link} />
  );
};
HeaderBreadcrumbs.displayName = "HeaderBreadcrumbs";
