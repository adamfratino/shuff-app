import { Fragment } from "react";
import { CodeInline, Tooltip } from "@uiid/design-system";
import type { SigToken } from "../lib/docs";

export function TypeTokens({ tokens }: { tokens: readonly SigToken[] }) {
  return (
    <>
      {tokens.map((token, i) =>
        token.kind === "text" ? (
          <Fragment key={i}>{token.value}</Fragment>
        ) : (
          <Tooltip
            key={i}
            trigger={<CodeInline>{token.name}</CodeInline>}
          >
            <CodeInline>{token.shape}</CodeInline>
          </Tooltip>
        ),
      )}
    </>
  );
}
