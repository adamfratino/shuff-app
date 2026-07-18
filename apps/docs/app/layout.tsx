import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Group, Stack } from "@uiid/design-system";

import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { OnThisPage } from "@/components/on-this-page";

import {
  ASIDE_WIDTH,
  CONTENT_MAX_WIDTH,
  SHELL_SPACING,
  SIDEBAR_SPACING,
  SHELL_BORDER_WIDTH,
  SITE_TITLE,
  SITE_DESCRIPTION,
} from "@/constants";

import "./globals.css";

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<React.PropsWithChildren>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Body>
        <AppShellOuter>
          <Sidebar />
          <AppShellInner>
            <Header />
            <ContentRow>
              <Main>{children}</Main>
              <AsideContainer>
                <OnThisPage />
              </AsideContainer>
            </ContentRow>
          </AppShellInner>
        </AppShellOuter>
      </Body>
    </html>
  );
}

const Body = ({ children }: React.PropsWithChildren) => {
  return (
    <Stack
      data-slot="body"
      render={<body />}
      className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      fullwidth
    >
      {children}
    </Stack>
  );
};
Body.displayName = "Body";

const AppShellOuter = ({ children }: React.PropsWithChildren) => {
  return (
    <Group data-slot="app-shell-outer" fullwidth>
      {children}
    </Group>
  );
};
AppShellOuter.displayName = "AppShellOuter";

const AppShellInner = ({ children }: React.PropsWithChildren) => {
  return (
    <Stack data-slot="app-shell-inner" className="flex-1">
      {children}
    </Stack>
  );
};
AppShellInner.displayName = "AppShellInner";

const ContentRow = ({ children }: React.PropsWithChildren) => {
  return (
    <Group data-slot="content-row" className="flex-1" ay="start" fullwidth>
      {children}
    </Group>
  );
};
ContentRow.displayName = "ContentRow";

const Main = ({ children }: React.PropsWithChildren) => {
  return (
    <Stack
      data-slot="main"
      render={<main />}
      className="min-w-0"
      maxw={CONTENT_MAX_WIDTH}
      br={SHELL_BORDER_WIDTH}
      p={SHELL_SPACING}
      fullwidth
      fullheight
    >
      {children}
    </Stack>
  );
};
Main.displayName = "Main";

const AsideContainer = ({ children }: React.PropsWithChildren) => {
  return (
    <Stack
      data-slot="aside"
      render={<aside />}
      maxw={ASIDE_WIDTH}
      gap={SIDEBAR_SPACING}
      px={SIDEBAR_SPACING}
      py={SHELL_SPACING}
      ax="stretch"
      fullwidth
      className="sticky top-10 overflow-y-auto max-h-screen"
    >
      {children}
    </Stack>
  );
};
AsideContainer.displayName = "AsideContainer";
