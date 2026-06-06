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
  flags?: { isOptional?: boolean };
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

export type DocParam = {
  name: string;
  type: string;
  description: CommentPart[];
  optional: boolean;
};

export type DocEntry = {
  slug: string;
  name: string;
  kind: EntryKind;
  description: CommentPart[];
  signature?: string;
  parameters: DocParam[];
  returnType?: string;
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
      const name = String((t as { name?: string }).name ?? "");
      return `${name}${args}`;
    }
    case "array":
      return `${renderType(t.elementType)}[]`;
    case "union":
      return ((t.types as unknown[]) ?? []).map(renderType).join(" | ");
    case "intersection":
      return ((t.types as unknown[]) ?? []).map(renderType).join(" & ");
    case "tuple":
      return `[${((t.elements as unknown[]) ?? []).map(renderType).join(", ")}]`;
    case "typeOperator":
      return `${String(t.operator ?? "")} ${renderType(t.target)}`;
    case "reflection":
      return "object";
    case "indexedAccess":
      return `${renderType(t.objectType)}[${renderType(t.indexType)}]`;
    case "predicate":
      return `${String(t.name ?? "")} is ${renderType(t.targetType)}`;
    default:
      return String(t.name ?? "");
  }
}

function buildSignature(sig: TypeDocSignature | undefined): string | undefined {
  if (!sig) return undefined;
  const params = (sig.parameters ?? [])
    .map((p) => {
      const ty = renderType(p.type);
      const optional = p.flags?.isOptional ? "?" : "";
      return ty ? `${p.name}${optional}: ${ty}` : `${p.name}${optional}`;
    })
    .join(", ");
  const ret = renderType(sig.type);
  return `${sig.name}(${params})${ret ? `: ${ret}` : ""}`;
}

function toEntry(child: TypeDocChild): DocEntry {
  const kind = KIND_MAP[child.kind] ?? "other";
  const sig = child.signatures?.[0];
  const comment = sig?.comment ?? child.comment;
  const parameters: DocParam[] = (sig?.parameters ?? []).map((p) => ({
    name: p.name,
    type: renderType(p.type),
    description: p.comment?.summary ?? [],
    optional: Boolean(p.flags?.isOptional),
  }));
  return {
    slug: child.name,
    name: child.name,
    kind,
    description: comment?.summary ?? [],
    signature: buildSignature(sig),
    parameters,
    returnType: sig ? renderType(sig.type) : undefined,
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
