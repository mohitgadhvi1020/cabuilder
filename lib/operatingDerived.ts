import type { FinancialGridRow } from "./types";
import { cascadeValuesFromFirstColumn, rowUsesGrowthLock } from "./operatingGrowth";

/** Recalculate total rows for every year column (Finline-style linked totals). */
export function deriveOperatingRows(
  rows: FinancialGridRow[],
  columnIds: string[]
): FinancialGridRow[] {
  const r = rows.map((row) => {
    let values = { ...row.values };
    if (rowUsesGrowthLock(row)) {
      const p = row.growthPct ?? 0;
      values = cascadeValuesFromFirstColumn(values, columnIds, p);
    }
    return {
      ...row,
      values,
    };
  });

  const get = (id: string, col: string) => r.find((x) => x.id === id)?.values[col] ?? 0;
  const set = (id: string, col: string, v: number) => {
    const row = r.find((x) => x.id === id);
    if (row) row.values[col] = v;
  };

  const sum = (ids: string[], col: string) => ids.reduce((s, id) => s + get(id, col), 0);

  for (const col of columnIds) {
    set("os-3", col, get("os-1", col) - get("os-2", col));
    set("os-10", col, sum(["os-5", "os-6", "os-7", "os-8", "os-9"], col));
    set("os-11", col, get("os-3", col) - get("os-10", col));
    set("os-16", col, sum(["os-13", "os-14", "os-15"], col));
    set("os-17", col, get("os-11", col) - get("os-16", col));
    set("os-19", col, get("os-17", col) + get("os-18", col));
    set("os-21", col, get("os-19", col) - get("os-20", col));
  }

  return r;
}
