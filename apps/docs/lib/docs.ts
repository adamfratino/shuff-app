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
  children?: TypeDocChild[];
  flags?: { isOptional?: boolean };
};

type TypeDocProject = {
  name: string;
  children?: TypeDocChild[];
};

export type EntryKind = "function" | "variable" | "type" | "interface" | "other";

export type EntryRole =
  | "function"
  | "component"
  | "constant"
  | "type"
  | "interface"
  | "other";

export function roleOf(entry: { kind: EntryKind; name: string }): EntryRole {
  switch (entry.kind) {
    case "function":
      return /^[A-Z]/.test(entry.name) ? "component" : "function";
    case "variable":
      return "constant";
    case "type":
      return "type";
    case "interface":
      return "interface";
    default:
      return "other";
  }
}

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
  /** Members of a type/interface (e.g. component props), when it has any. */
  props?: DocParam[];
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
      const name = String((t as { name?: string }).name ?? "");
      const args = Array.isArray(t.typeArguments)
        ? `<${(t.typeArguments as unknown[]).map(renderType).join(", ")}>`
        : "";
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
    case "indexedAccess":
      return `${renderType(t.objectType)}[${renderType(t.indexType)}]`;
    case "predicate":
      return `${String(t.name ?? "")} is ${renderType(t.targetType)}`;
    case "reflection":
      return "object";
    default:
      return String(t.name ?? "");
  }
}

function renderObjectShape(children: readonly TypeDocChild[]): string {
  const props = children.map((c) => {
    const optional = c.flags?.isOptional ? "?" : "";
    return `${c.name}${optional}: ${renderType(c.type)}`;
  });
  return `{ ${props.join("; ")} }`;
}

function aliasShape(child: TypeDocChild): string | undefined {
  if (child.children?.length) return renderObjectShape(child.children);
  if (child.type) return renderType(child.type);
  return undefined;
}

function buildSignature(sig: TypeDocSignature | undefined): string | undefined {
  if (!sig) return undefined;
  const params = (sig.parameters ?? []).map((p) => {
    const ty = renderType(p.type);
    const optional = p.flags?.isOptional ? "?" : "";
    return ty ? `${p.name}${optional}: ${ty}` : `${p.name}${optional}`;
  });
  const ret = renderType(sig.type);
  const retSuffix = ret ? `: ${ret}` : "";
  if (params.length === 0) return `${sig.name}()${retSuffix}`;
  return `${sig.name}(\n  ${params.join(",\n  ")},\n)${retSuffix}`;
}

function formatAliasShape(name: string, shape: string): string {
  if (shape.startsWith("{ ") && shape.endsWith(" }")) {
    const inner = shape.slice(2, -2);
    const props = inner.split("; ").filter(Boolean);
    if (props.length <= 1) return `type ${name} = ${shape}`;
    return `type ${name} = {\n  ${props.join(";\n  ")};\n}`;
  }
  if (shape.includes(" | ")) {
    const parts = shape.split(" | ");
    if (parts.length <= 2) return `type ${name} = ${shape}`;
    return `type ${name} =\n  | ${parts.join("\n  | ")}`;
  }
  return `type ${name} = ${shape}`;
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
    shape:
      kind === "type"
        ? (() => {
            const raw = aliasShape(child);
            return raw ? formatAliasShape(child.name, raw) : undefined;
          })()
        : undefined,
    props:
      (kind === "type" || kind === "interface") && child.children?.length
        ? child.children.map((c) => ({
            name: c.name,
            type: renderType(c.type),
            description: c.comment?.summary ?? [],
            optional: Boolean(c.flags?.isOptional),
          }))
        : undefined,
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
