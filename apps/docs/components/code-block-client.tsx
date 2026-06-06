"use client";

import { CodeBlock } from "@uiid/design-system";

export function CodeBlockClient({
  code,
  language,
  html,
}: {
  code: string;
  language: "typescript" | "tsx";
  html: string;
}) {
  return (
    <CodeBlock
      code={code}
      language={language}
      html={html}
      copyable
    />
  );
}
