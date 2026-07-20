import fs from "node:fs/promises";
import path from "node:path";

const EXAMPLES_DIR = path.resolve(process.cwd(), "examples");
const EXPORT_PATTERN = /^export const /m;

/** True for lines that are blank or purely comment (line or block style). */
const isCommentOrBlank = (line: string): boolean => {
  const t = line.trim();
  return (
    t === "" || t.startsWith("//") || t.startsWith("/*") || t.startsWith("*")
  );
};

/**
 * Slices a single named `export const` (and its body) out of a file in the
 * examples directory. Used to surface an example's source and the mock-data
 * literals it references without hand-duplicating them. The slice runs to the
 * next `export const`, so trailing comment lines — they document the *next*
 * export, not this one — are stripped off the end.
 */
/**
 * Reads a self-contained snippet file (relative to the examples directory),
 * displayed whole — imports and all. Snippets are real modules the app
 * typechecks, so the shown code can't rot.
 */
export async function readSnippetSource(file: string): Promise<string> {
  const source = await fs.readFile(path.join(EXAMPLES_DIR, file), "utf-8");
  return source.trimEnd();
}

export async function readExportSource(
  file: string,
  name: string,
): Promise<string | undefined> {
  const source = await fs.readFile(path.join(EXAMPLES_DIR, file), "utf-8");
  const start = source.search(new RegExp(`^export const ${name}\\b`, "m"));
  if (start === -1) return undefined;
  const rest = source.slice(start + 1);
  const nextExport = rest.search(EXPORT_PATTERN);
  const end = nextExport === -1 ? source.length : start + 1 + nextExport;
  const lines = source.slice(start, end).split("\n");
  for (let last = lines.at(-1); last !== undefined && isCommentOrBlank(last); ) {
    lines.pop();
    last = lines.at(-1);
  }
  return lines.join("\n");
}
