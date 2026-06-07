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

export type SigToken =
  | { kind: "text"; value: string }
  | { kind: "ref"; name: string; shape: string };

export type DocParam = {
  name: string;
  typeTokens: SigToken[];
  description: CommentPart[];
  optional: boolean;
};

export type DocEntry = {
  slug: string;
  name: string;
  kind: EntryKind;
  description: CommentPart[];
  signatureTokens?: SigToken[];
  parameters: DocParam[];
  returnTokens?: SigToken[];
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

function tokensToString(tokens: readonly SigToken[]): string {
  return tokens
    .map((t) => (t.kind === "text" ? t.value : t.name))
    .join("");
}

function renderTypeString(type: unknown, aliases: AliasMap | null): string {
  return tokensToString(renderTypeTokens(type, aliases));
}

function joinTokens(
  groups: readonly SigToken[][],
  separator: string,
): SigToken[] {
  const out: SigToken[] = [];
  groups.forEach((g, i) => {
    if (i > 0) out.push({ kind: "text", value: separator });
    out.push(...g);
  });
  return out;
}

function renderTypeTokens(
  type: unknown,
  aliases: AliasMap | null,
): SigToken[] {
  if (!type || typeof type !== "object") return [];
  const t = type as Record<string, unknown>;
  switch (t.type) {
    case "intrinsic":
      return [{ kind: "text", value: String(t.name ?? "") }];
    case "literal":
      return [{ kind: "text", value: JSON.stringify(t.value) }];
    case "reference": {
      const name = String((t as { name?: string }).name ?? "");
      const shape = aliases?.get(name);
      const head: SigToken =
        shape !== undefined
          ? { kind: "ref", name, shape }
          : { kind: "text", value: name };
      if (Array.isArray(t.typeArguments)) {
        const args = (t.typeArguments as unknown[]).map((a) =>
          renderTypeTokens(a, aliases),
        );
        return [
          head,
          { kind: "text", value: "<" },
          ...joinTokens(args, ", "),
          { kind: "text", value: ">" },
        ];
      }
      return [head];
    }
    case "array":
      return [
        ...renderTypeTokens(t.elementType, aliases),
        { kind: "text", value: "[]" },
      ];
    case "union":
      return joinTokens(
        ((t.types as unknown[]) ?? []).map((x) => renderTypeTokens(x, aliases)),
        " | ",
      );
    case "intersection":
      return joinTokens(
        ((t.types as unknown[]) ?? []).map((x) => renderTypeTokens(x, aliases)),
        " & ",
      );
    case "tuple":
      return [
        { kind: "text", value: "[" },
        ...joinTokens(
          ((t.elements as unknown[]) ?? []).map((x) =>
            renderTypeTokens(x, aliases),
          ),
          ", ",
        ),
        { kind: "text", value: "]" },
      ];
    case "typeOperator":
      return [
        { kind: "text", value: `${String(t.operator ?? "")} ` },
        ...renderTypeTokens(t.target, aliases),
      ];
    case "indexedAccess":
      return [
        ...renderTypeTokens(t.objectType, aliases),
        { kind: "text", value: "[" },
        ...renderTypeTokens(t.indexType, aliases),
        { kind: "text", value: "]" },
      ];
    case "predicate":
      return [
        { kind: "text", value: `${String(t.name ?? "")} is ` },
        ...renderTypeTokens(t.targetType, aliases),
      ];
    case "reflection":
      return [{ kind: "text", value: "object" }];
    default:
      return [{ kind: "text", value: String(t.name ?? "") }];
  }
}

function renderObjectShape(
  children: readonly TypeDocChild[],
  aliases: AliasMap | null,
): string {
  const props = children.map((c) => {
    const optional = c.flags?.isOptional ? "?" : "";
    return `${c.name}${optional}: ${renderTypeString(c.type, aliases)}`;
  });
  return `{ ${props.join("; ")} }`;
}

function aliasShape(child: TypeDocChild): string | undefined {
  if (child.children?.length) return renderObjectShape(child.children, null);
  if (child.type) return renderTypeString(child.type, null);
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

const SIGNATURE_WRAP_AT = 80;

function buildSignatureTokens(
  sig: TypeDocSignature | undefined,
  aliases: AliasMap,
): SigToken[] | undefined {
  if (!sig) return undefined;
  const paramTokenGroups: SigToken[][] = (sig.parameters ?? []).map((p) => {
    const typeTokens = renderTypeTokens(p.type, aliases);
    const optional = p.flags?.isOptional ? "?" : "";
    const head: SigToken = { kind: "text", value: `${p.name}${optional}: ` };
    return typeTokens.length === 0 ? [head] : [head, ...typeTokens];
  });
  const returnTokens = renderTypeTokens(sig.type, aliases);
  const retSuffix: SigToken[] =
    returnTokens.length === 0
      ? []
      : [{ kind: "text", value: ": " }, ...returnTokens];

  const inlineParams = joinTokens(paramTokenGroups, ", ");
  const inline: SigToken[] = [
    { kind: "text", value: `${sig.name}(` },
    ...inlineParams,
    { kind: "text", value: ")" },
    ...retSuffix,
  ];
  if (tokensToString(inline).length <= SIGNATURE_WRAP_AT) return inline;

  const out: SigToken[] = [{ kind: "text", value: `${sig.name}(\n` }];
  paramTokenGroups.forEach((g) => {
    out.push({ kind: "text", value: "  " });
    out.push(...g);
    out.push({ kind: "text", value: ",\n" });
  });
  out.push({ kind: "text", value: ")" });
  out.push(...retSuffix);
  return out;
}

function formatAliasShape(name: string, shape: string): string {
  const decl = `type ${name} = ${shape}`;
  if (decl.length <= SIGNATURE_WRAP_AT) return decl;
  if (shape.startsWith("{ ") && shape.endsWith(" }")) {
    const inner = shape.slice(2, -2);
    const props = inner.split("; ").filter(Boolean);
    return `type ${name} = {\n  ${props.join(";\n  ")};\n}`;
  }
  if (shape.includes(" | ")) {
    const parts = shape.split(" | ");
    return `type ${name} =\n  | ${parts.join("\n  | ")}`;
  }
  return decl;
}

function toEntry(child: TypeDocChild, aliases: AliasMap): DocEntry {
  const kind = KIND_MAP[child.kind] ?? "other";
  const sig = child.signatures?.[0];
  const comment = sig?.comment ?? child.comment;
  const parameters: DocParam[] = (sig?.parameters ?? []).map((p) => ({
    name: p.name,
    typeTokens: renderTypeTokens(p.type, aliases),
    description: p.comment?.summary ?? [],
    optional: Boolean(p.flags?.isOptional),
  }));
  return {
    slug: child.name,
    name: child.name,
    kind,
    description: comment?.summary ?? [],
    signatureTokens: buildSignatureTokens(sig, aliases),
    parameters,
    returnTokens: sig ? renderTypeTokens(sig.type, aliases) : undefined,
    shape:
      kind === "type"
        ? (() => {
            const raw = aliasShape(child);
            return raw ? formatAliasShape(child.name, raw) : undefined;
          })()
        : undefined,
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
