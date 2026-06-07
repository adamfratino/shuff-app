import { Fragment } from "react";
import Link from "next/link";
import { CodeInline } from "@uiid/design-system";
import type { TypeToken } from "../lib/docs";

export function TypeTokens({ tokens }: { tokens: readonly TypeToken[] }) {
  return (
    <>
      {tokens.map((token, i) =>
        token.kind === "text" ? (
          <Fragment key={i}>{token.value}</Fragment>
        ) : (
          <Link key={i} href={token.href}>
            <CodeInline>{token.name}</CodeInline>
          </Link>
        ),
      )}
    </>
  );
}
