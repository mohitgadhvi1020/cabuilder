/**
 * CMA calculation engine — pure, column-keyed, no React, no I/O.
 *
 * Ports the verified formula chain of `CMA_G.xlsx` (Forms II, III, V + ratios).
 * Cross-module imports here are intentionally **type-only** so this file can be
 * executed directly with `node engine.test.ts` (Node type-stripping) as well as
 * bundled by Next. See `engine.test.ts` for the Excel parity check.
 */
import type { Driver } from "./schema";
import type { YearColumn, YearValues } from "../types";

/** One column's values, keyed by CMA line id. */
export type LineValues = Record<string, number>;

const n = (v: number | undefined) => (Number.isFinite(v) ? (v as number) : 0);
const round2 = (v: number) => Math.round(v * 100) / 100;

/* ------------------------------------------------------------------ *
 * Derived-total chain — Form II (Operating Statement)
 * ------------------------------------------------------------------ */
export function deriveOperating(v: LineValues): LineValues {
  const g = (id: string) => n(v[id]);
  const o: LineValues = { ...v };

  o["os.gross_sales"] = g("os.domestic_sales") + g("os.export_sales") + g("os.other_income");
  o["os.net_sales"] = o["os.gross_sales"] - g("os.vat_excise");

  o["cost.subtotal"] =
    g("cost.raw_material") +
    g("cost.stores_spares") +
    g("cost.goods_traded") +
    g("cost.power_fuel") +
    g("cost.direct_labour") +
    g("cost.other_mfg") +
    g("cost.depreciation");
  o["cost.cop"] = o["cost.subtotal"] + g("cost.opening_wip") - g("cost.closing_wip");
  o["cost.total_cost_of_sales"] = o["cost.cop"] + g("cost.opening_fg") - g("cost.closing_fg");

  o["os.gross_profit"] = o["os.net_sales"] - o["cost.total_cost_of_sales"];
  o["os.operating_profit"] = o["os.gross_profit"] - g("os.sga");
  o["os.pbdit"] = o["os.operating_profit"] + g("cost.depreciation");
  o["os.op_after_interest"] = o["os.operating_profit"] - g("os.interest");
  o["os.pbt"] = o["os.op_after_interest"] + g("os.net_nonop");
  o["os.net_profit"] = o["os.pbt"] - g("os.tax");
  o["os.retained_profit"] = o["os.net_profit"] - g("os.dividend");
  return o;
}

/* ------------------------------------------------------------------ *
 * Derived-total chain — Form III (Balance Sheet)
 * ------------------------------------------------------------------ */
export function deriveBalanceSheet(v: LineValues): LineValues {
  const g = (id: string) => n(v[id]);
  const o: LineValues = { ...v };

  o["bs.total_cl"] =
    g("bs.bank_borrowings") +
    g("bs.creditors_trade") +
    g("bs.advances_customers") +
    g("bs.provision_tax") +
    g("bs.other_cl");
  o["bs.total_tl"] = g("bs.term_loans") + g("bs.unsecured_loans");
  o["bs.total_outside_liab"] = o["bs.total_cl"] + o["bs.total_tl"];
  o["bs.net_worth"] = g("bs.share_capital") + g("bs.reserves");
  o["bs.total_liabilities"] = o["bs.total_outside_liab"] + o["bs.net_worth"];

  o["bs.total_ca"] =
    g("bs.cash_bank") +
    g("bs.receivables_domestic") +
    g("bs.receivables_export") +
    g("bs.inventory_rm") +
    g("bs.inventory_wip") +
    g("bs.inventory_fg") +
    g("bs.advances_suppliers");
  o["bs.net_block"] = g("bs.gross_block") - g("bs.depreciation_todate");
  o["bs.total_assets"] =
    o["bs.total_ca"] + o["bs.net_block"] + g("bs.non_current_assets") + g("bs.intangibles");

  o["bs.tnw"] = o["bs.net_worth"] - g("bs.intangibles");
  o["bs.nwc"] = o["bs.total_ca"] - o["bs.total_cl"];
  o["bs.current_ratio"] = o["bs.total_cl"] > 0 ? o["bs.total_ca"] / o["bs.total_cl"] : 0;
  o["bs.tol_tnw"] = o["bs.tnw"] > 0 ? o["bs.total_outside_liab"] / o["bs.tnw"] : 0;
  return o;
}

/** Apply both derive chains for a single column. */
export function computeColumn(v: LineValues): LineValues {
  return deriveBalanceSheet(deriveOperating(v));
}

/* ------------------------------------------------------------------ *
 * Form V — Maximum Permissible Bank Finance (MPBF)
 * ------------------------------------------------------------------ */
export interface MpbfResult {
  totalCurrentAssets: number;
  otherCurrentLiabilities: number; // CL excluding bank borrowing
  workingCapitalGap: number; // WCG = TCA - OCL
  minStipulatedNwc: number; // 25% of WCG
  actualNwc: number; // TCA - total CL
  methodI: number; // WCG - min NWC
  methodII: number; // WCG - actual NWC
  mpbf: number; // min(methodI, methodII)
  excessBorrowing: number; // shortfall in NWC = min NWC - actual NWC (if +ve)
}

const NWC_MARGIN = 0.25; // RBI Tandon method-II stipulation

export function computeMPBF(v: LineValues): MpbfResult {
  const c = computeColumn(v);
  const totalCurrentAssets = n(c["bs.total_ca"]);
  const totalCl = n(c["bs.total_cl"]);
  const otherCurrentLiabilities = totalCl - n(c["bs.bank_borrowings"]);
  const workingCapitalGap = totalCurrentAssets - otherCurrentLiabilities;
  const minStipulatedNwc = NWC_MARGIN * workingCapitalGap;
  const actualNwc = n(c["bs.nwc"]); // TCA - total CL
  const methodI = workingCapitalGap - minStipulatedNwc;
  const methodII = workingCapitalGap - actualNwc;
  const mpbf = Math.min(methodI, methodII);
  return {
    totalCurrentAssets: round2(totalCurrentAssets),
    otherCurrentLiabilities: round2(otherCurrentLiabilities),
    workingCapitalGap: round2(workingCapitalGap),
    minStipulatedNwc: round2(minStipulatedNwc),
    actualNwc: round2(actualNwc),
    methodI: round2(methodI),
    methodII: round2(methodII),
    mpbf: round2(mpbf),
    excessBorrowing: round2(Math.max(0, minStipulatedNwc - actualNwc)),
  };
}

/* ------------------------------------------------------------------ *
 * Ratio analysis (subset of the CMA-sheet ratio block)
 * ------------------------------------------------------------------ */
export interface RatioSet {
  grossProfitRatio: number;
  operatingProfitRatio: number;
  netProfitRatio: number;
  pbditInterest: number;
  currentRatio: number;
  tolTnw: number;
  netSalesGrowth: number | null; // null when no prior column
}

export function computeRatios(v: LineValues, prev?: LineValues): RatioSet {
  const c = computeColumn(v);
  const ns = n(c["os.net_sales"]);
  const safe = (num: number, den: number) => (den !== 0 ? num / den : 0);
  const prevNs = prev ? n(computeColumn(prev)["os.net_sales"]) : 0;
  return {
    grossProfitRatio: round4(safe(n(c["os.gross_profit"]), ns)),
    operatingProfitRatio: round4(safe(n(c["os.operating_profit"]), ns)),
    netProfitRatio: round4(safe(n(c["os.net_profit"]), ns)),
    pbditInterest: n(c["os.interest"]) > 0 ? round2(safe(n(c["os.pbdit"]), n(c["os.interest"]))) : 0,
    currentRatio: round4(n(c["bs.current_ratio"])),
    tolTnw: round4(n(c["bs.tol_tnw"])),
    netSalesGrowth: prev && prevNs !== 0 ? round4(ns / prevNs - 1) : null,
  };
}
const round4 = (v: number) => Math.round(v * 10000) / 10000;

/* ------------------------------------------------------------------ *
 * Projection — produce a projected column's input lines from drivers
 * ------------------------------------------------------------------ */
export interface DriverParam {
  /** growth %: 0.1 = +10%; pct_of_sales: 0.6 = 60%; months: number of months. */
  value: number;
}

/**
 * Resolve one projected column's input-line values from the previous (resolved)
 * column and per-line driver params. `driverOf` supplies each line's driver kind.
 * Derived lines are skipped here (filled later by computeColumn).
 */
export function projectColumn(
  prevResolved: LineValues,
  driverOf: (lineId: string) => Driver,
  params: Record<string, DriverParam>,
  manualOverrides: LineValues = {}
): LineValues {
  const out: LineValues = {};
  const prev = computeColumn(prevResolved);
  const netSales = n(prev["os.net_sales"]); // basis for pct_of_sales (uses prior net sales as proxy)

  for (const id of Object.keys(prev)) {
    if (id in manualOverrides) {
      out[id] = manualOverrides[id];
      continue;
    }
    const driver = driverOf(id);
    const p = params[id]?.value;
    switch (driver) {
      case "growth":
        out[id] = round2(n(prev[id]) * (1 + n(p)));
        break;
      case "pct_of_sales":
        out[id] = round2(netSales * n(p));
        break;
      case "months_cons":
      case "months_sales":
        // months basis resolved against current net sales once known; seed with
        // prior value, refined by the caller after net sales is computed.
        out[id] = round2(n(prev[id]));
        break;
      case "input":
        out[id] = n(prev[id]); // carry forward unless overridden
        break;
      // derived: skip — recomputed by computeColumn
    }
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Year columns (port of the workbook's Master year-driver)
 * ------------------------------------------------------------------ */
export function buildYearColumns(
  startYear: number,
  actualYears: number,
  totalYears: number
): YearColumn[] {
  const cols: YearColumn[] = [];
  for (let i = 0; i < totalYears; i++) {
    const y = startYear + i;
    cols.push({
      id: `col_${i}`,
      label: `${y}-${String(y + 1).slice(-2)}`,
      kind: i < actualYears ? "actual" : "estimated",
    });
  }
  return cols;
}

/** Convenience: re-key a per-line/per-column model into per-column LineValues. */
export function columnSlice(
  model: Record<string, YearValues>,
  colId: string
): LineValues {
  const out: LineValues = {};
  for (const lineId of Object.keys(model)) out[lineId] = n(model[lineId]?.[colId]);
  return out;
}
