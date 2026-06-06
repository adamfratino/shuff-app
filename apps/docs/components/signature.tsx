import { codeToHtml } from "shiki";
import { CodeBlockContent } from "@uiid/design-system";

export async function Signature({
  code,
  language = "typescript",
}: {
  code: string;
  language?: "typescript" | "tsx";
}) {
  const html = await codeToHtml(code, {
    lang: language,
    theme: "github-light",
  });
  return <CodeBlockContent html={html} />;
}
