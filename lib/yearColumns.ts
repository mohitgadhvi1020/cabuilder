import type { LoanReportConfig, YearColumn, YearHeadingRow } from "./types";

export function defaultYearHeadings(cfg: LoanReportConfig): YearHeadingRow[] {
  const audited =
    cfg.auditedYears.length > 0 ? cfg.auditedYears : ["2023-2024", "2024-2025"];
  const headings: YearHeadingRow[] = audited.map((label) => ({
    yearLabel: label,
    type: "actual" as const,
  }));
  for (let j = 1; j <= cfg.projectionCount; j++) {
    headings.push({
      yearLabel: `Projection ${j}`,
      type: "estimated",
    });
  }
  return headings;
}

export function headingsToColumns(headings: YearHeadingRow[]): YearColumn[] {
  return headings.map((h, i) => ({
    id: `col_${i}`,
    label: h.yearLabel,
    kind: h.type,
  }));
}

export function expectedHeadingCount(cfg: LoanReportConfig): number {
  const audited = cfg.auditedYears.length > 0 ? cfg.auditedYears.length : 2;
  return audited + cfg.projectionCount;
}

export function alignYearHeadings(
  cfg: LoanReportConfig,
  existing: YearHeadingRow[]
): YearHeadingRow[] {
  const target = expectedHeadingCount(cfg);
  const def = defaultYearHeadings(cfg);
  if (existing.length === target) {
    return existing.map((row, i) => ({
      yearLabel: row.yearLabel || def[i]?.yearLabel || `Year ${i + 1}`,
      type: row.type ?? def[i]?.type ?? "estimated",
    }));
  }
  return def;
}
