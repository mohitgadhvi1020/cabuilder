/**
 * Canonical CMA line taxonomy (RBI / Tandon-Nayak banker format), modelled as data.
 *
 * This is the single source of truth that drives BOTH the input grids and the
 * Forms II-VI report rendering. It mirrors the row structure of the reference
 * workbook `CMA_G.xlsx` (sheets `Actual` -> `CMA Calculations` -> `CMA`).
 *
 * The math lives in `./engine.ts`. Here we only describe each line: where it
 * belongs, how a projected column is driven, and whether it is a typed total.
 */

export type FormId = "II" | "III" | "IV" | "V" | "VI" | "RATIO";

/**
 * How a *projected* (estimated) column value for a line is produced.
 * Actual columns are always direct inputs regardless of driver.
 *  - input        : entered by hand in every column
 *  - growth       : prevColumn * (1 + growth%)          (sales lines)
 *  - pct_of_sales : netSales * pct                       (cost lines)
 *  - months_cons  : annualConsumption * months / 12      (stock / creditors)
 *  - months_sales : annualSales * months / 12            (debtors)
 *  - derived      : computed by the engine from other lines (never entered)
 */
export type Driver =
  | "input"
  | "growth"
  | "pct_of_sales"
  | "months_cons"
  | "months_sales"
  | "derived";

export interface CmaLine {
  /** Stable semantic key, e.g. "os.net_sales". Used across model, engine, UI. */
  id: string;
  label: string;
  form: FormId;
  /** Visual grouping within a form (e.g. "Cost of sales", "Current assets"). */
  section?: string;
  driver: Driver;
  /** For derived lines: the engine rule that produces this value. */
  derive?: string;
  indent?: number;
  isTotal?: boolean;
  /** Rendered as a ratio/percentage rather than an amount. */
  isRatio?: boolean;
}

/* ------------------------------------------------------------------ *
 * FORM II — OPERATING STATEMENT
 * ------------------------------------------------------------------ */
export const OPERATING_STATEMENT: CmaLine[] = [
  { id: "os.domestic_sales", label: "Domestic sales", form: "II", section: "Sales", driver: "growth" },
  { id: "os.export_sales", label: "Export sales", form: "II", section: "Sales", driver: "growth" },
  { id: "os.other_income", label: "Direct income", form: "II", section: "Sales", driver: "growth" },
  { id: "os.gross_sales", label: "Gross sales", form: "II", section: "Sales", driver: "derived", derive: "sum_sales", isTotal: true },
  { id: "os.vat_excise", label: "Less: VAT & Excise duty", form: "II", section: "Sales", driver: "input" },
  { id: "os.net_sales", label: "NET SALES", form: "II", section: "Sales", driver: "derived", derive: "net_sales", isTotal: true },

  { id: "cost.raw_material", label: "Raw materials consumption (incl. stores)", form: "II", section: "Cost of sales", driver: "pct_of_sales" },
  { id: "cost.stores_spares", label: "Stores & spares", form: "II", section: "Cost of sales", driver: "pct_of_sales" },
  { id: "cost.goods_traded", label: "Cost of goods traded", form: "II", section: "Cost of sales", driver: "pct_of_sales" },
  { id: "cost.power_fuel", label: "Power and fuel", form: "II", section: "Cost of sales", driver: "pct_of_sales" },
  { id: "cost.direct_labour", label: "Direct labour (factory wages & salaries)", form: "II", section: "Cost of sales", driver: "pct_of_sales" },
  { id: "cost.other_mfg", label: "Other mfg. expenses", form: "II", section: "Cost of sales", driver: "pct_of_sales" },
  { id: "cost.depreciation", label: "Depreciation", form: "II", section: "Cost of sales", driver: "input" },
  { id: "cost.subtotal", label: "Sub-total (cost of production inputs)", form: "II", section: "Cost of sales", driver: "derived", derive: "cost_subtotal", isTotal: true },
  { id: "cost.opening_wip", label: "Add: Opening stock-in-process", form: "II", section: "Cost of sales", driver: "input" },
  { id: "cost.closing_wip", label: "Deduct: Closing stock-in-process", form: "II", section: "Cost of sales", driver: "months_cons" },
  { id: "cost.cop", label: "COST OF PRODUCTION", form: "II", section: "Cost of sales", driver: "derived", derive: "cop", isTotal: true },
  { id: "cost.opening_fg", label: "Add: Opening stock of finished goods", form: "II", section: "Cost of sales", driver: "input" },
  { id: "cost.closing_fg", label: "Deduct: Closing stock of finished goods", form: "II", section: "Cost of sales", driver: "months_cons" },
  { id: "cost.total_cost_of_sales", label: "TOTAL COST OF SALES", form: "II", section: "Cost of sales", driver: "derived", derive: "total_cost_of_sales", isTotal: true },

  { id: "os.gross_profit", label: "Gross Profit", form: "II", section: "Profit", driver: "derived", derive: "gross_profit", isTotal: true },
  { id: "os.sga", label: "Selling, general & administrative expenses", form: "II", section: "Profit", driver: "pct_of_sales" },
  { id: "os.operating_profit", label: "Operating profit before interest", form: "II", section: "Profit", driver: "derived", derive: "operating_profit", isTotal: true },
  { id: "os.pbdit", label: "Profit before dep., int. & tax (PBDIT)", form: "II", section: "Profit", driver: "derived", derive: "pbdit", isTotal: true },
  { id: "os.interest", label: "Total interest", form: "II", section: "Profit", driver: "input" },
  { id: "os.op_after_interest", label: "Operating profit after interest", form: "II", section: "Profit", driver: "derived", derive: "op_after_interest", isTotal: true },
  { id: "os.net_nonop", label: "Net other non-operating income/(expense)", form: "II", section: "Profit", driver: "input" },
  { id: "os.pbt", label: "Profit before tax / loss", form: "II", section: "Profit", driver: "derived", derive: "pbt", isTotal: true },
  { id: "os.tax", label: "Provision for taxes (incl. deferred)", form: "II", section: "Profit", driver: "input" },
  { id: "os.net_profit", label: "NET PROFIT / LOSS", form: "II", section: "Profit", driver: "derived", derive: "net_profit", isTotal: true },
  { id: "os.dividend", label: "Less: Dividend", form: "II", section: "Profit", driver: "input" },
  { id: "os.retained_profit", label: "RETAINED PROFIT", form: "II", section: "Profit", driver: "derived", derive: "retained_profit", isTotal: true },
];

/* ------------------------------------------------------------------ *
 * FORM III — ANALYSIS OF BALANCE SHEET
 * ------------------------------------------------------------------ */
export const BALANCE_SHEET: CmaLine[] = [
  // Current liabilities
  { id: "bs.bank_borrowings", label: "Short-term bank borrowings (incl. BP/BD)", form: "III", section: "Current liabilities", driver: "input" },
  { id: "bs.creditors_trade", label: "Sundry creditors (trade)", form: "III", section: "Current liabilities", driver: "months_cons" },
  { id: "bs.advances_customers", label: "Advance payments from customers", form: "III", section: "Current liabilities", driver: "input" },
  { id: "bs.provision_tax", label: "Provision for taxation", form: "III", section: "Current liabilities", driver: "input" },
  { id: "bs.other_cl", label: "Other current liabilities & provisions", form: "III", section: "Current liabilities", driver: "input" },
  { id: "bs.total_cl", label: "TOTAL CURRENT LIABILITIES", form: "III", section: "Current liabilities", driver: "derived", derive: "total_cl", isTotal: true },
  // Term liabilities
  { id: "bs.term_loans", label: "Term loans (excl. instalments due within 1 yr)", form: "III", section: "Term liabilities", driver: "input" },
  { id: "bs.unsecured_loans", label: "Other term liabilities (unsecured loans)", form: "III", section: "Term liabilities", driver: "input" },
  { id: "bs.total_tl", label: "TOTAL TERM LIABILITIES", form: "III", section: "Term liabilities", driver: "derived", derive: "total_tl", isTotal: true },
  { id: "bs.total_outside_liab", label: "TOTAL OUTSIDE LIABILITIES", form: "III", section: "Term liabilities", driver: "derived", derive: "total_outside_liab", isTotal: true },
  // Net worth
  { id: "bs.share_capital", label: "Paid-up capital", form: "III", section: "Net worth", driver: "input" },
  { id: "bs.reserves", label: "Reserves & surplus (excl. revaluation)", form: "III", section: "Net worth", driver: "input" },
  { id: "bs.net_worth", label: "NET WORTH", form: "III", section: "Net worth", driver: "derived", derive: "net_worth", isTotal: true },
  { id: "bs.total_liabilities", label: "TOTAL LIABILITIES", form: "III", section: "Net worth", driver: "derived", derive: "total_liabilities", isTotal: true },
  // Current assets
  { id: "bs.cash_bank", label: "Cash and bank balance", form: "III", section: "Current assets", driver: "input" },
  { id: "bs.receivables_domestic", label: "Receivables (other than export & deferred)", form: "III", section: "Current assets", driver: "months_sales" },
  { id: "bs.receivables_export", label: "Export receivables (incl. BP/BD)", form: "III", section: "Current assets", driver: "months_sales" },
  { id: "bs.inventory_rm", label: "Inventory: raw materials (incl. stores)", form: "III", section: "Current assets", driver: "months_cons" },
  { id: "bs.inventory_wip", label: "Inventory: stock-in-process", form: "III", section: "Current assets", driver: "months_cons" },
  { id: "bs.inventory_fg", label: "Inventory: finished goods", form: "III", section: "Current assets", driver: "months_cons" },
  { id: "bs.advances_suppliers", label: "Advances to suppliers / other current assets", form: "III", section: "Current assets", driver: "input" },
  { id: "bs.total_ca", label: "TOTAL CURRENT ASSETS", form: "III", section: "Current assets", driver: "derived", derive: "total_ca", isTotal: true },
  // Fixed & non-current assets
  { id: "bs.gross_block", label: "Gross block", form: "III", section: "Fixed assets", driver: "input" },
  { id: "bs.depreciation_todate", label: "Depreciation to date", form: "III", section: "Fixed assets", driver: "input" },
  { id: "bs.net_block", label: "NET BLOCK", form: "III", section: "Fixed assets", driver: "derived", derive: "net_block", isTotal: true },
  { id: "bs.non_current_assets", label: "Other non-current assets", form: "III", section: "Fixed assets", driver: "input" },
  { id: "bs.intangibles", label: "Intangible assets", form: "III", section: "Fixed assets", driver: "input" },
  { id: "bs.total_assets", label: "TOTAL ASSETS", form: "III", section: "Fixed assets", driver: "derived", derive: "total_assets", isTotal: true },
  // Derived analysis
  { id: "bs.tnw", label: "Tangible net worth", form: "III", section: "Analysis", driver: "derived", derive: "tnw", isTotal: true },
  { id: "bs.nwc", label: "Net working capital", form: "III", section: "Analysis", driver: "derived", derive: "nwc", isTotal: true },
  { id: "bs.current_ratio", label: "Current ratio", form: "III", section: "Analysis", driver: "derived", derive: "current_ratio", isRatio: true },
  { id: "bs.tol_tnw", label: "TOL / TNW", form: "III", section: "Analysis", driver: "derived", derive: "tol_tnw", isRatio: true },
];

/** All lines, indexed by id. */
export const ALL_LINES: CmaLine[] = [...OPERATING_STATEMENT, ...BALANCE_SHEET];
export const LINE_BY_ID: Record<string, CmaLine> = Object.fromEntries(
  ALL_LINES.map((l) => [l.id, l])
);

/** Lines a user enters/drives directly (everything except derived). */
export const INPUT_LINE_IDS: string[] = ALL_LINES.filter(
  (l) => l.driver !== "derived"
).map((l) => l.id);
