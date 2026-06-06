import {
  CodeInline,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
  Text,
} from "@uiid/design-system";
import type { DocParam } from "../lib/docs";
import { Comment } from "./comment";

export function ParamsTable({ params }: { params: readonly DocParam[] }) {
  if (params.length === 0) return null;
  const anyDescription = params.some((p) => p.description.length > 0);
  return (
    <TableRoot>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Text size={-1} shade="muted">
              Name
            </Text>
          </TableHead>
          <TableHead>
            <Text size={-1} shade="muted">
              Type
            </Text>
          </TableHead>
          {anyDescription && (
            <TableHead>
              <Text size={-1} shade="muted">
                Description
              </Text>
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {params.map((p) => (
          <TableRow key={p.name}>
            <TableCell>
              <Text size={0} family="mono">
                {p.name}
                {p.optional ? "?" : ""}
              </Text>
            </TableCell>
            <TableCell>
              {p.type ? <CodeInline>{p.type}</CodeInline> : null}
            </TableCell>
            {anyDescription && (
              <TableCell>
                <Comment parts={p.description} />
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </TableRoot>
  );
}
