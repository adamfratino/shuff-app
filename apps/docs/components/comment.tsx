import { Fragment } from "react";
import { CodeInline } from "@uiid/design-system";
import { Text } from "@uiid/design-system";

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
        <Text key={i} size={0} shade="muted">
          {blocks.map((part, j) =>
            part.kind === "code" ? (
              <CodeInline key={j}>{stripBackticks(part.text)}</CodeInline>
            ) : (
              <Fragment key={j}>{part.text}</Fragment>
            ),
          )}
        </Text>
      ))}
    </>
  );
}
