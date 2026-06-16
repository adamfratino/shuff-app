import { CodeBlock, highlight } from "@uiid/design-system";

export async function Signature({
  code,
  language = "typescript",
}: {
  code: string;
  language?: "typescript" | "tsx";
}) {
  const html = await highlight(code, language);
  return <CodeBlock code={code} language={language} html={html} />;
}
