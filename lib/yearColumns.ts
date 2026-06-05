import type { LoanReportConfig, YearColumn, YearHeadingRow } from "./types";

/**
 * Parse the start year of a financial-year label like "2023-2024" or "2023-24".
 * Returns null when the label is not a parseable year (e.g. "Year 1").
 */
export function parseFyStartYear(label: string): number | null {
  const m = label.match(/(\d{4})/);
  if (!m) return null;
  const y = parseInt(m[1], 10);
  return y >= 1900 && y <= 2999 ? y : null;
}

/** Build a financial-year label from a start year, e.g. 2024 -> "2024-2025". */
export function fyLabel(startYear: number): string {
  return `${startYear}-${startYear + 1}`;
}

export function defaultYearHeadings(cfg: LoanReportConfig): YearHeadingRow[] {
  const audited =
    cfg.auditedYears.length > 0 ? cfg.auditedYears : ["2023-2024", "2024-2025"];
  const headings: YearHeadingRow[] = audited.map((label) => ({
    yearLabel: label,
    type: "actual" as const,
  }));

  // Continue the financial-year sequence from the last audited year so projection
  // columns read as real years (2024-2025, 2025-2026, …) — matching the banker
  // CMA "Master" year-driver — instead of generic "Projection N" placeholders.
  const lastAuditedStart = parseFyStartYear(audited[audited.length - 1] ?? "");
  for (let j = 1; j <= cfg.projectionCount; j++) {
    headings.push({
      yearLabel:
        lastAuditedStart !== null
          ? fyLabel(lastAuditedStart + j)
          : `Projection ${j}`,
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

/** A generic, non-customized placeholder label that should be auto-upgraded. */
function isPlaceholderLabel(label: string): boolean {
  return !label.trim() || /^(projection|year)\s*\d+$/i.test(label.trim());
}

export function alignYearHeadings(
  cfg: LoanReportConfig,
  existing: YearHeadingRow[]
): YearHeadingRow[] {
  const target = expectedHeadingCount(cfg);
  const def = defaultYearHeadings(cfg);
  if (existing.length === target) {
    return existing.map((row, i) => ({
      // Keep user-customized labels; upgrade generic "Projection N"/"Year N"
      // placeholders to the continuing financial-year label.
      yearLabel: isPlaceholderLabel(row.yearLabel)
        ? def[i]?.yearLabel || row.yearLabel || `Year ${i + 1}`
        : row.yearLabel,
      type: row.type ?? def[i]?.type ?? "estimated",
    }));
  }
  return def;
}
