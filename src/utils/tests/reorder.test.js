import { describe, it, expect } from "vitest";
import { moveItem, remapIndexAfterMove } from "../reorder";

describe("moveItem", () => {
  it("moves item from lower index to higher index", () => {
    expect(moveItem(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
  });

  it("moves item from higher index to lower index", () => {
    expect(moveItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });

  it("returns original array for invalid indexes", () => {
    const items = ["a", "b"];
    expect(moveItem(items, -1, 1)).toBe(items);
    expect(moveItem(items, 0, 5)).toBe(items);
  });
});

describe("remapIndexAfterMove", () => {
  it("moves active index with moved item", () => {
    expect(remapIndexAfterMove(0, 0, 2)).toBe(2);
  });

  it("shifts indexes between source and target", () => {
    expect(remapIndexAfterMove(1, 0, 2)).toBe(0);
    expect(remapIndexAfterMove(1, 2, 0)).toBe(2);
  });
});
