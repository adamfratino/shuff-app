import { List, Stack, Text } from "@uiid/design-system";
import Link from "next/link";
import { allDocs, groupByKind, KIND_ORDER } from "../lib/docs";

const ROUTE_BY_PKG: Record<string, string> = {
  "@shuff/core": "/core",
  "@shuff/diagram": "/diagram",
};

export function Sidebar() {
  return (
    <aside data-slot="sidebar">
      <Stack gap={4} maxw={240} p={8} br={1} fullheight>
        <Text size={1} weight="bold">
          shuff docs
        </Text>
        {allDocs.map((pkg) => {
          const route = ROUTE_BY_PKG[pkg.pkg] ?? "/";
          const groups = groupByKind(pkg.entries);
          return (
            <Stack key={pkg.pkg} gap={3}>
              <Link href={route}>
                <Text size={0} weight="bold" family="mono">
                  {pkg.pkg}
                </Text>
              </Link>
              {KIND_ORDER.flatMap((kind) => {
                const items = groups.get(kind);
                if (!items || items.length === 0) return [];
                return (
                  <Stack key={kind} gap={1}>
                    <Text size={-1} shade="muted">
                      {kind}
                    </Text>
                    <List
                      type="none"
                      size="small"
                      items={items.map((entry) => ({
                        value: entry.slug,
                        label: (
                          <Link href={`${route}#${entry.slug}`}>
                            <Text size={0} family="mono">
                              {entry.name}
                            </Text>
                          </Link>
                        ),
                      }))}
                    />
                  </Stack>
                );
              })}
            </Stack>
          );
        })}
      </Stack>
    </aside>
  );
}
