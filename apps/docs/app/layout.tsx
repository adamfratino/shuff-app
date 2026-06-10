import { Group } from "@uiid/design-system";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { Sidebar } from "../components/sidebar";

import "@uiid/design-system/globals.css";

export const metadata: Metadata = {
  title: "shuff docs",
  description:
    "Documentation for @shuff/core (shuffleboard math) and @shuff/diagram (React court component).",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Group data-slot="layout-body" render={<body />} m={0} fullscreen>
        <Sidebar />
        <main>{children}</main>
      </Group>
    </html>
  );
}
