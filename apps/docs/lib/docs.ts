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

export type TypeToken =
  | { kind: "text"; value: string }
  | { kind: "ref"; name: string; href: string };

export type DocParam = {
  name: string;
  typeTokens: TypeToken[];
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
  returnTokens: TypeToken[];
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

const ROUTE_BY_PKG: Record<string, string> = {
  "@shuff/core": "/core",
  "@shuff/diagram": "/diagram",
};

type RouteMap = Map<string, string>;

function buildRouteMap(projects: readonly TypeDocProject[]): RouteMap {
  const map: RouteMap = new Map();
  for (const project of projects) {
    const route = ROUTE_BY_PKG[project.name];
    if (!route) continue;
    for (const child of project.children ?? []) {
      if (child.kind !== 2097152) continue;
      map.set(child.name, `${route}#${child.name}`);
    }
  }
  return map;
}

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

function joinTokens(
  groups: readonly TypeToken[][],
  separator: string,
): TypeToken[] {
  const out: TypeToken[] = [];
  groups.forEach((g, i) => {
    if (i > 0) out.push({ kind: "text", value: separator });
    out.push(...g);
  });
  return out;
}

function renderTypeTokens(type: unknown, routes: RouteMap): TypeToken[] {
  if (!type || typeof type !== "object") return [];
  const t = type as Record<string, unknown>;
  switch (t.type) {
    case "intrinsic":
      return [{ kind: "text", value: String(t.name ?? "") }];
    case "literal":
      return [{ kind: "text", value: JSON.stringify(t.value) }];
    case "reference": {
      const name = String((t as { name?: string }).name ?? "");
      const href = routes.get(name);
      const head: TypeToken =
        href !== undefined
          ? { kind: "ref", name, href }
          : { kind: "text", value: name };
      if (Array.isArray(t.typeArguments)) {
        const args = (t.typeArguments as unknown[]).map((a) =>
          renderTypeTokens(a, routes),
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
        ...renderTypeTokens(t.elementType, routes),
        { kind: "text", value: "[]" },
      ];
    case "union":
      return joinTokens(
        ((t.types as unknown[]) ?? []).map((x) => renderTypeTokens(x, routes)),
        " | ",
      );
    case "intersection":
      return joinTokens(
        ((t.types as unknown[]) ?? []).map((x) => renderTypeTokens(x, routes)),
        " & ",
      );
    case "tuple":
      return [
        { kind: "text", value: "[" },
        ...joinTokens(
          ((t.elements as unknown[]) ?? []).map((x) =>
            renderTypeTokens(x, routes),
          ),
          ", ",
        ),
        { kind: "text", value: "]" },
      ];
    case "typeOperator":
      return [
        { kind: "text", value: `${String(t.operator ?? "")} ` },
        ...renderTypeTokens(t.target, routes),
      ];
    case "indexedAccess":
      return [
        ...renderTypeTokens(t.objectType, routes),
        { kind: "text", value: "[" },
        ...renderTypeTokens(t.indexType, routes),
        { kind: "text", value: "]" },
      ];
    case "predicate":
      return [
        { kind: "text", value: `${String(t.name ?? "")} is ` },
        ...renderTypeTokens(t.targetType, routes),
      ];
    case "reflection":
      return [{ kind: "text", value: "object" }];
    default:
      return [{ kind: "text", value: String(t.name ?? "") }];
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

const SIGNATURE_WRAP_AT = 80;

function buildSignature(sig: TypeDocSignature | undefined): string | undefined {
  if (!sig) return undefined;
  const params = (sig.parameters ?? []).map((p) => {
    const ty = renderType(p.type);
    const optional = p.flags?.isOptional ? "?" : "";
    return ty ? `${p.name}${optional}: ${ty}` : `${p.name}${optional}`;
  });
  const ret = renderType(sig.type);
  const retSuffix = ret ? `: ${ret}` : "";
  const oneLine = `${sig.name}(${params.join(", ")})${retSuffix}`;
  if (oneLine.length <= SIGNATURE_WRAP_AT) return oneLine;
  return `${sig.name}(\n  ${params.join(",\n  ")},\n)${retSuffix}`;
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

function toEntry(child: TypeDocChild, routes: RouteMap): DocEntry {
  const kind = KIND_MAP[child.kind] ?? "other";
  const sig = child.signatures?.[0];
  const comment = sig?.comment ?? child.comment;
  const parameters: DocParam[] = (sig?.parameters ?? []).map((p) => ({
    name: p.name,
    typeTokens: renderTypeTokens(p.type, routes),
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
    returnTokens: sig ? renderTypeTokens(sig.type, routes) : [],
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

function loadManifest(project: TypeDocProject, routes: RouteMap): DocsManifest {
  return {
    pkg: project.name,
    entries: (project.children ?? []).map((c) => toEntry(c, routes)),
  };
}

const routeMap = buildRouteMap([
  core as TypeDocProject,
  diagram as TypeDocProject,
]);

export const coreDocs: DocsManifest = loadManifest(core as TypeDocProject, routeMap);
export const diagramDocs: DocsManifest = loadManifest(diagram as TypeDocProject, routeMap);

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
