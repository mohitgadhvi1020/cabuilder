import type { FinancialGridRow } from "./types";

/** Implied YoY % from first to second year column (display when row is unlocked). */
export function impliedYoYGrowthPct(values: Record<string, number>, colIds: string[]): number {
  if (colIds.length < 2) return 0;
  const a = values[colIds[0]] ?? 0;
  const b = values[colIds[1]] ?? 0;
  if (a === 0) return 0;
  return Math.round(((b / a - 1) * 100) * 100) / 100;
}

/** Fill values[col[i]] from col[0] using compound (1+p/100) each step. */
export function cascadeValuesFromFirstColumn(
  values: Record<string, number>,
  colIds: string[],
  pct: number
): Record<string, number> {
  if (colIds.length === 0) return { ...values };
  const next = { ...values };
  const factor = 1 + pct / 100;
  for (let i = 1; i < colIds.length; i++) {
    const prev = next[colIds[i - 1]] ?? 0;
    next[colIds[i]] = Math.round(prev * factor * 100) / 100;
  }
  return next;
}

export function rowUsesGrowthLock(row: FinancialGridRow): boolean {
  return Boolean(row.growthPctLocked && !row.isHeader && !row.isTotal);
}

/** Label for printed / preview % column */
export function formatOperatingGrowthLabel(
  row: FinancialGridRow,
  colIds: string[]
): string {
  if (row.isHeader || row.isTotal) return "—";
  if (colIds.length < 2) return "—";
  const pct = row.growthPctLocked ? row.growthPct ?? 0 : impliedYoYGrowthPct(row.values, colIds);
  if (!row.growthPctLocked && (row.values[colIds[0]] ?? 0) === 0) return "—";
  return `${pct.toFixed(2)}%`;
}
