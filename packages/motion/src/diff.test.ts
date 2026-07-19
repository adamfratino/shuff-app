import { describe, expect, it } from "vitest";

import { diffBoards } from "./diff";
import type { TrackedDisc } from "./types";

const disc = (
  id: string,
  x: number,
  y: number,
  color = "#f5c518",
): TrackedDisc => ({ id, x, y, color });

describe("diffBoards", () => {
  it("returns an empty diff for identical boards", () => {
    const board = [disc("a", 36, 108), disc("b", 20, 50)];
    expect(diffBoards(board, board)).toEqual({
      added: [],
      removedIds: [],
      moves: [],
    });
  });

  it("detects a moved disc with its endpoints", () => {
    const { moves } = diffBoards([disc("a", 36, 220)], [disc("a", 36, 108)]);
    expect(moves).toEqual([
      { id: "a", from: { x: 36, y: 220 }, to: { x: 36, y: 108 } },
    ]);
  });

  it("detects added and removed discs", () => {
    const { added, removedIds, moves } = diffBoards(
      [disc("a", 36, 108)],
      [disc("b", 20, 50)],
    );
    expect(added).toEqual([disc("b", 20, 50)]);
    expect(removedIds).toEqual(["a"]);
    expect(moves).toEqual([]);
  });

  it("ignores color and z-order changes", () => {
    const current = [disc("a", 36, 108, "#f5c518"), disc("b", 20, 50)];
    const target = [disc("b", 20, 50), disc("a", 36, 108, "#1a1a1a")];
    expect(diffBoards(current, target)).toEqual({
      added: [],
      removedIds: [],
      moves: [],
    });
  });

  it("treats sub-epsilon drift as unmoved", () => {
    const { moves } = diffBoards(
      [disc("a", 36, 108)],
      [disc("a", 36.0000001, 108)],
    );
    expect(moves).toEqual([]);
  });

  it("reports a simultaneous move, add, and removal", () => {
    const { added, removedIds, moves } = diffBoards(
      [disc("a", 36, 220), disc("gone", 10, 10)],
      [disc("a", 33, 95), disc("new", 44, 40)],
    );
    expect(moves.map((m) => m.id)).toEqual(["a"]);
    expect(added.map((d) => d.id)).toEqual(["new"]);
    expect(removedIds).toEqual(["gone"]);
  });
});
