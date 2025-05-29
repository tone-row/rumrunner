// @ts-nocheck
// Cartesian product utility for eval framework

/**
 * Computes the cartesian product of named sets.
 *
 * Example:
 *   const color = new Set(["red", "blue"]);
 *   const size = new Set(["S", "M"]);
 *   const combos = product({ color, size });
 *   // combos: [
 *   //   { color: "red", size: "S" },
 *   //   { color: "red", size: "M" },
 *   //   { color: "blue", size: "S" },
 *   //   { color: "blue", size: "M" },
 *   // ]
 */
export function product<T extends Record<string, Iterable<any>>>(
  sets: T
): Array<{ [K in keyof T]: T[K] extends Iterable<infer U> ? U : never }> {
  const keys = Object.keys(sets) as (keyof T)[];
  if (keys.length === 0) return [];

  // Convert all sets to arrays for easier indexing
  const arrays = keys.map((k) => Array.from(sets[k]));

  // Early exit if any set is empty
  if (arrays.some((arr) => arr.length === 0)) return [];

  // Recursive cartesian product
  const result: any[] = [];
  function helper(idx: number, acc: any) {
    if (idx === keys.length) {
      result.push({ ...acc });
      return;
    }
    for (const value of arrays[idx]) {
      acc[keys[idx]] = value;
      helper(idx + 1, acc);
    }
  }
  helper(0, {});
  return result;
}
