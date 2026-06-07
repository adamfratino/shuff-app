"use client";

import { CodeBlock } from "@uiid/design-system";

export function Signature({
  code,
  language = "typescript",
}: {
  code: string;
  language?: "typescript" | "tsx";
}) {
  return <CodeBlock code={code} language={language} copyable />;
}
