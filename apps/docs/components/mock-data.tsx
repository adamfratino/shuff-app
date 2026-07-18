import { CodeBlock } from "@uiid/design-system";

import { highlightCached } from "../lib/highlight";
import { readExportSource } from "../lib/source";
import { Disclosure } from "./disclosure";

/**
 * A collapsed disclosure, coupled to an example, that reveals the exact disc
 * datasets the example plots — sliced straight from `data.ts` so the numbers
 * shown always match what renders. Kept intentionally simple until we build a
 * richer code-block component.
 */
export async function MockData({ data }: { data: readonly string[] }) {
  const snippets = await Promise.all(
    data.map((name) => readExportSource("data.ts", name)),
  );
  const code = snippets.filter(Boolean).join("\n\n");
  if (!code) return null;
  const html = await highlightCached(code, "tsx");

  return (
    <Disclosure label="Mock data">
      <CodeBlock
        code={code}
        html={html}
        language="tsx"
        filename="data.ts"
        rows={12}
      />
    </Disclosure>
  );
}
