import { describe, it, expect } from "bun:test";
import { product } from "../src/product";

describe("product", () => {
  it("returns [] for empty input", () => {
    expect(product({})).toEqual([]);
  });

  it("returns [] if any set is empty", () => {
    expect(product({ a: new Set(), b: new Set([1, 2]) })).toEqual([]);
    expect(product({ a: new Set([1]), b: [] })).toEqual([]);
  });

  it("works for a single set", () => {
    expect(product({ a: new Set([1, 2]) })).toEqual([{ a: 1 }, { a: 2 }]);
    expect(product({ a: ["x"] })).toEqual([{ a: "x" }]);
  });

  it("works for two sets", () => {
    const result = product({
      color: new Set(["red", "blue"]),
      size: ["S", "M"],
    });
    expect(result).toEqual([
      { color: "red", size: "S" },
      { color: "red", size: "M" },
      { color: "blue", size: "S" },
      { color: "blue", size: "M" },
    ]);
  });

  it("works for three sets", () => {
    const result = product({
      a: [1, 2],
      b: ["x", "y"],
      c: [true, false],
    });
    expect(result.length).toBe(8);
    expect(result).toContainEqual({ a: 1, b: "x", c: true });
    expect(result).toContainEqual({ a: 2, b: "y", c: false });
  });

  it("handles sets with different types", () => {
    const result = product({
      num: new Set([1]),
      str: ["a", "b"],
      bool: [true],
    });
    expect(result).toEqual([
      { num: 1, str: "a", bool: true },
      { num: 1, str: "b", bool: true },
    ]);
  });

  it("handles large sets (stress test)", () => {
    const a = Array.from({ length: 10 }, (_, i) => i);
    const b = Array.from({ length: 5 }, (_, i) => i + 100);
    const combos = product({ a, b });
    expect(combos.length).toBe(10 * 5);
    expect(combos[0]).toEqual({ a: 0, b: 100 });
    expect(combos.at(-1)).toEqual({ a: 9, b: 104 });
  });

  it("does not mutate input sets", () => {
    const s = new Set([1, 2]);
    const before = Array.from(s);
    product({ s });
    expect(Array.from(s)).toEqual(before);
  });
});
