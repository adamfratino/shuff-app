import { codeToHtml } from "shiki";
import { CodeBlockClient } from "./code-block-client";

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
  return <CodeBlockClient code={code} language={language} html={html} />;
}
