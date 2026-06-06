import core from "../.docs-cache/core.json";
import diagram from "../.docs-cache/diagram.json";

type CommentPart = { kind: "text" | "code"; text: string };

type TypeDocComment = {
  summary?: CommentPart[];
};

type TypeDocParam = {
  name: string;
  type?: unknown;
  comment?: TypeDocComment;
};

type TypeDocSignature = {
  name: string;
  parameters?: TypeDocParam[];
  type?: unknown;
  comment?: TypeDocComment;
};

type TypeDocChild = {
  id: number;
  name: string;
  kind: number;
  signatures?: TypeDocSignature[];
  comment?: TypeDocComment;
  type?: unknown;
  defaultValue?: string;
};

type TypeDocProject = {
  name: string;
  children?: TypeDocChild[];
};

export type EntryKind = "function" | "variable" | "type" | "interface" | "other";

export type DocEntry = {
  slug: string;
  name: string;
  kind: EntryKind;
  description: CommentPart[];
  signature?: string;
};

export type DocsManifest = {
  pkg: string;
  entries: DocEntry[];
};

const KIND_MAP: Record<number, EntryKind> = {
  32: "variable",
  64: "function",
  256: "interface",
  2097152: "type",
};

function renderType(type: unknown): string {
  if (!type || typeof type !== "object") return "";
  const t = type as Record<string, unknown>;
  switch (t.type) {
    case "intrinsic":
      return String(t.name ?? "");
    case "literal":
      return JSON.stringify(t.value);
    case "reference": {
      const args = Array.isArray(t.typeArguments)
        ? `<${(t.typeArguments as unknown[]).map(renderType).join(", ")}>`
        : "";
      return `${t.name ?? ""}${args}`;
    }
    case "array":
      return `${renderType(t.elementType)}[]`;
    case "union":
      return ((t.types as unknown[]) ?? []).map(renderType).join(" | ");
    case "intersection":
      return ((t.types as unknown[]) ?? []).map(renderType).join(" & ");
    case "tuple":
      return `[${((t.elements as unknown[]) ?? []).map(renderType).join(", ")}]`;
    case "reflection":
      return "object";
    default:
      return String(t.name ?? "");
  }
}

function buildSignature(child: TypeDocChild): string | undefined {
  const sig = child.signatures?.[0];
  if (!sig) return undefined;
  const params = (sig.parameters ?? [])
    .map((p) => {
      const ty = renderType(p.type);
      return ty ? `${p.name}: ${ty}` : p.name;
    })
    .join(", ");
  const ret = renderType(sig.type);
  return `${sig.name}(${params})${ret ? `: ${ret}` : ""}`;
}

function toEntry(child: TypeDocChild): DocEntry {
  const kind = KIND_MAP[child.kind] ?? "other";
  const comment = child.signatures?.[0]?.comment ?? child.comment;
  return {
    slug: child.name,
    name: child.name,
    kind,
    description: comment?.summary ?? [],
    signature: buildSignature(child),
  };
}

function loadManifest(project: TypeDocProject): DocsManifest {
  return {
    pkg: project.name,
    entries: (project.children ?? []).map(toEntry),
  };
}

export const coreDocs: DocsManifest = loadManifest(core as TypeDocProject);
export const diagramDocs: DocsManifest = loadManifest(diagram as TypeDocProject);

export const allDocs: readonly DocsManifest[] = [coreDocs, diagramDocs];

export const KIND_ORDER: EntryKind[] = [
  "function",
  "variable",
  "type",
  "interface",
  "other",
];

export function groupByKind(entries: readonly DocEntry[]): Map<EntryKind, DocEntry[]> {
  const groups = new Map<EntryKind, DocEntry[]>();
  for (const entry of entries) {
    const list = groups.get(entry.kind) ?? [];
    list.push(entry);
    groups.set(entry.kind, list);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }
  return groups;
}
