import fs from "node:fs/promises";
import path from "node:path";

const EXAMPLES_DIR = path.resolve(process.cwd(), "examples");
const EXPORT_PATTERN = /^export const /m;

/**
 * Slices a single named `export const` (and its body) out of a file in the
 * examples directory. Used to surface an example's source and the mock-data
 * literals it references without hand-duplicating them.
 */
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
  return source.slice(start, end).trimEnd();
}
