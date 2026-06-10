import { CodeInline, Text } from "@uiid/design-system";
import { Fragment } from "react";

type CommentPart = { kind: "text" | "code"; text: string };

function stripBackticks(text: string): string {
  return text.replace(/^`|`$/g, "");
}

export function Comment({ parts }: { parts: readonly CommentPart[] }) {
  if (parts.length === 0) return null;
  const paragraphs: CommentPart[][] = [[]];
  for (const part of parts) {
    if (part.kind === "text") {
      const blocks = part.text.split(/\n\s*\n/);
      blocks.forEach((block, i) => {
        if (i > 0) paragraphs.push([]);
        paragraphs[paragraphs.length - 1]!.push({
          kind: "text",
          text: block.replace(/\n/g, " "),
        });
      });
    } else {
      paragraphs[paragraphs.length - 1]!.push(part);
    }
  }
  return (
    <>
      {paragraphs.map((blocks, i) => (
        // Parsed comment parts never reorder — index is a stable key here.
        // biome-ignore lint/suspicious/noArrayIndexKey: static parsed output
        <Fragment key={i}>
          {blocks.map((part, j) =>
            part.kind === "code" ? (
              // biome-ignore lint/suspicious/noArrayIndexKey: static parsed output
              <CodeInline key={j}>{stripBackticks(part.text)}</CodeInline>
            ) : (
              // biome-ignore lint/suspicious/noArrayIndexKey: static parsed output
              <Fragment key={j}>{part.text}</Fragment>
            ),
          )}
        </Fragment>
      ))}
    </>
  );
}
