import { codeToHtml } from "shiki";

export async function Signature({ code }: { code: string }) {
  const html = await codeToHtml(code, {
    lang: "typescript",
    theme: "github-light",
    structure: "inline",
  });
  return (
    <pre
      style={{
        fontSize: 13,
        margin: 0,
        padding: "0.5rem 0.75rem",
        background: "var(--shade-1, #f6f6f6)",
        borderRadius: 4,
        overflowX: "auto",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
