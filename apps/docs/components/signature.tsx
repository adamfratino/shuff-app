import { CodeBlock } from "@uiid/design-system";

import { highlightCached } from "../lib/highlight";

export async function Signature({
  code,
  language = "typescript",
}: {
  code: string;
  language?: "typescript" | "tsx";
}) {
  const html = await highlightCached(code, language);
  return <CodeBlock code={code} language={language} html={html} />;
}
