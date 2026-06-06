import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@uiid/design-system/globals.css";
import { Sidebar } from "../components/sidebar";

export const metadata: Metadata = {
  title: "shuff docs",
  description:
    "Documentation for @shuff/core (shuffleboard math) and @shuff/diagram (React court component).",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <div style={{ display: "flex", alignItems: "stretch", minHeight: "100vh" }}>
          <Sidebar />
          <main
            style={{
              flex: 1,
              padding: "2rem 3rem",
              maxWidth: 900,
            }}
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
