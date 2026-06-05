/**
 * Excel parity test for the CMA engine.
 *
 * Run directly with Node's TypeScript stripping (no test framework needed):
 *     node lib/cma/engine.test.ts
 * or via npm:
 *     npm run verify:engine
 *
 * Strategy: feed the engine the *sub-totals* the reference workbook computed for
 * the sample borrower (GALAXY TECHNO FORGE), then assert the engine reproduces
 * every higher-level total — Operating Statement, Balance Sheet, and Form V MPBF —
 * for all four reporting columns (E,F,G,H = 2 actual + 2 projected years).
 */
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { computeColumn, computeMPBF } from "./engine.ts";
import type { LineValues } from "./engine.ts";

const here = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
  readFileSync(join(here, "__fixtures__", "cma_g_ground_truth.json"), "utf8")
) as {
  cma_calculations: Record<string, { label: string | null; vals: Record<string, number> }>;
};
const calc = fixture.cma_calculations;

const COLS = ["E", "F", "G", "H"] as const;
const AMT_TOL = 0.06; // lacs — accumulated 2-dp rounding
const RATIO_TOL = 0.001;

/** Fixture value for a workbook row + column (0 when blank). */
const fx = (row: number, col: string): number => calc[String(row)]?.vals?.[col] ?? 0;

let passed = 0;
let failed = 0;
const near = (actual: number, expected: number, tol: number, msg: string) => {
  if (Math.abs(actual - expected) <= tol) {
    passed++;
  } else {
    failed++;
    console.error(`  ✗ ${msg}\n      engine=${actual}  excel=${expected}  Δ=${(actual - expected).toFixed(4)}`);
  }
};

for (const col of COLS) {
  // --- Build engine inputs from the workbook's own sub-totals ---------------
  const depr = fx(73, col);
  const tcos = fx(89, col); // TOTAL COST OF SALES
  const totalCa = fx(297, col);
  const netBlock = fx(306, col);
  const totalAssets = fx(332, col);

  const input: LineValues = {
    // Operating statement (sales fed as net; costs fed as the TCoS sub-total)
    "os.domestic_sales": fx(43, col), // net sales
    "os.export_sales": 0,
    "os.other_income": 0,
    "os.vat_excise": 0,
    "cost.raw_material": tcos - depr, // so subtotal(=TCoS) reconstructs exactly
    "cost.depreciation": depr, // kept separate for PBDIT add-back
    "os.sga": fx(94, col),
    "os.interest": fx(104, col),
    "os.net_nonop": fx(142, col),
    "os.tax": fx(147, col) + fx(150, col), // current + deferred
    "os.dividend": fx(156, col),

    // Balance sheet
    "bs.bank_borrowings": fx(174, col), // SUB TOTAL (A)
    "bs.other_cl": fx(201, col), // SUB TOTAL (B)
    "bs.term_loans": fx(228, col), // total term liabilities
    "bs.reserves": fx(247, col), // net worth
    "bs.cash_bank": totalCa, // fed as a single current-asset bucket
    "bs.gross_block": netBlock, // depreciation_todate = 0 → net block
    "bs.non_current_assets": totalAssets - totalCa - netBlock, // residual to tie total assets
  };

  const c = computeColumn(input);

  // --- Operating statement ---------------------------------------------------
  near(c["os.net_sales"], fx(43, col), AMT_TOL, `[${col}] Net sales`);
  near(c["os.gross_profit"], fx(91, col), AMT_TOL, `[${col}] Gross profit`);
  near(c["os.operating_profit"], fx(99, col), AMT_TOL, `[${col}] Operating profit`);
  near(c["os.pbdit"], fx(101, col), AMT_TOL, `[${col}] PBDIT`);
  near(c["os.op_after_interest"], fx(130, col), AMT_TOL, `[${col}] Operating profit after interest`);
  near(c["os.pbt"], fx(144, col), AMT_TOL, `[${col}] Profit before tax`);
  near(c["os.net_profit"], fx(152, col), AMT_TOL, `[${col}] Net profit`);
  near(c["os.retained_profit"], fx(158, col), AMT_TOL, `[${col}] Retained profit`);

  // --- Balance sheet ---------------------------------------------------------
  near(c["bs.total_cl"], fx(203, col), AMT_TOL, `[${col}] Total current liabilities`);
  near(c["bs.total_ca"], fx(297, col), AMT_TOL, `[${col}] Total current assets`);
  near(c["bs.net_worth"], fx(247, col), AMT_TOL, `[${col}] Net worth`);
  near(c["bs.total_assets"], fx(332, col), AMT_TOL, `[${col}] Total assets`);
  near(c["bs.nwc"], fx(334, col), AMT_TOL, `[${col}] Net working capital`);
  near(c["bs.current_ratio"], fx(336, col), RATIO_TOL, `[${col}] Current ratio`);

  // --- Form V: MPBF (the crown check) ---------------------------------------
  const m = computeMPBF(input);
  near(m.workingCapitalGap, fx(421, col), AMT_TOL, `[${col}] MPBF · Working capital gap`);
  near(m.minStipulatedNwc, fx(422, col), AMT_TOL, `[${col}] MPBF · Min stipulated NWC (25%)`);
  near(m.actualNwc, fx(428, col), AMT_TOL, `[${col}] MPBF · Actual NWC`);
  near(m.methodI, fx(429, col), AMT_TOL, `[${col}] MPBF · Method I (WCG − min NWC)`);
  near(m.methodII, fx(430, col), AMT_TOL, `[${col}] MPBF · Method II (WCG − actual NWC)`);
  near(m.mpbf, fx(431, col), AMT_TOL, `[${col}] MPBF · Maximum Permissible Bank Finance`);
}

console.log(`\nCMA engine parity vs CMA_G.xlsx:  ${passed} passed, ${failed} failed`);
assert.equal(failed, 0, `${failed} parity assertion(s) failed`);
console.log("✓ Engine reproduces the workbook's Forms II/III/V totals for all columns.");
