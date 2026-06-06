import core from "../.docs-cache/core.json";
import diagram from "../.docs-cache/diagram.json";

type CommentPart = { kind: "text" | "code"; text: string };

type TypeDocComment = {
  summary?: CommentPart[];
};

type TypeDocSource = {
  fileName?: string;
  line?: number;
  url?: string;
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
  children?: TypeDocChild[];
  flags?: { isOptional?: boolean };
  sources?: TypeDocSource[];
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
  shape?: string;
  sourceUrl?: string;
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

type AliasMap = Map<string, string>;

function renderType(type: unknown, aliases: AliasMap | null): string {
  if (!type || typeof type !== "object") return "";
  const t = type as Record<string, unknown>;
  switch (t.type) {
    case "intrinsic":
      return String(t.name ?? "");
    case "literal":
      return JSON.stringify(t.value);
    case "reference": {
      const name = String((t as { name?: string }).name ?? "");
      if (aliases?.has(name)) return aliases.get(name)!;
      const args = Array.isArray(t.typeArguments)
        ? `<${(t.typeArguments as unknown[])
            .map((a) => renderType(a, aliases))
            .join(", ")}>`
        : "";
      return `${name}${args}`;
    }
    case "array":
      return `${renderType(t.elementType, aliases)}[]`;
    case "union":
      return ((t.types as unknown[]) ?? [])
        .map((x) => renderType(x, aliases))
        .join(" | ");
    case "intersection":
      return ((t.types as unknown[]) ?? [])
        .map((x) => renderType(x, aliases))
        .join(" & ");
    case "tuple":
      return `[${((t.elements as unknown[]) ?? [])
        .map((x) => renderType(x, aliases))
        .join(", ")}]`;
    case "typeOperator":
      return `${String(t.operator ?? "")} ${renderType(t.target, aliases)}`;
    case "indexedAccess":
      return `${renderType(t.objectType, aliases)}[${renderType(t.indexType, aliases)}]`;
    case "predicate":
      return `${String(t.name ?? "")} is ${renderType(t.targetType, aliases)}`;
    case "reflection":
      return "object";
    default:
      return String(t.name ?? "");
  }
}

function renderObjectShape(
  children: readonly TypeDocChild[],
  aliases: AliasMap | null,
): string {
  const props = children.map((c) => {
    const optional = c.flags?.isOptional ? "?" : "";
    return `${c.name}${optional}: ${renderType(c.type, aliases)}`;
  });
  return `{ ${props.join("; ")} }`;
}

function aliasShape(child: TypeDocChild): string | undefined {
  if (child.children?.length) return renderObjectShape(child.children, null);
  if (child.type) return renderType(child.type, null);
  return undefined;
}

function buildAliasMap(projects: readonly TypeDocProject[]): AliasMap {
  const map: AliasMap = new Map();
  for (const project of projects) {
    for (const child of project.children ?? []) {
      if (child.kind !== 2097152) continue;
      const shape = aliasShape(child);
      if (shape) map.set(child.name, shape);
    }
  }
  return map;
}

function buildSignature(
  sig: TypeDocSignature | undefined,
  aliases: AliasMap,
): string | undefined {
  if (!sig) return undefined;
  const params = (sig.parameters ?? [])
    .map((p) => {
      const ty = renderType(p.type, aliases);
      const optional = p.flags?.isOptional ? "?" : "";
      return ty ? `${p.name}${optional}: ${ty}` : `${p.name}${optional}`;
    })
    .join(", ");
  const ret = renderType(sig.type, aliases);
  return `${sig.name}(${params})${ret ? `: ${ret}` : ""}`;
}

function toEntry(child: TypeDocChild, aliases: AliasMap): DocEntry {
  const kind = KIND_MAP[child.kind] ?? "other";
  const sig = child.signatures?.[0];
  const comment = sig?.comment ?? child.comment;
  const parameters: DocParam[] = (sig?.parameters ?? []).map((p) => ({
    name: p.name,
    type: renderType(p.type, aliases),
    description: p.comment?.summary ?? [],
    optional: Boolean(p.flags?.isOptional),
  }));
  return {
    slug: child.name,
    name: child.name,
    kind,
    description: comment?.summary ?? [],
    signature: buildSignature(sig, aliases),
    parameters,
    returnType: sig ? renderType(sig.type, aliases) : undefined,
    shape: kind === "type" ? aliasShape(child) : undefined,
    sourceUrl: child.sources?.[0]?.url,
  };
}

function loadManifest(
  project: TypeDocProject,
  aliases: AliasMap,
): DocsManifest {
  return {
    pkg: project.name,
    entries: (project.children ?? []).map((c) => toEntry(c, aliases)),
  };
}

const aliasMap = buildAliasMap([core as TypeDocProject, diagram as TypeDocProject]);

export const coreDocs: DocsManifest = loadManifest(core as TypeDocProject, aliasMap);
export const diagramDocs: DocsManifest = loadManifest(diagram as TypeDocProject, aliasMap);

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
