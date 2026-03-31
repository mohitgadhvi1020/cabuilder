import type { MoneyFormat, OldTermLoan, YearValues } from "./types";

export function calculateGrossProfit(netSales: number, costOfGoods: number): number {
  return netSales - costOfGoods;
}

export function calculateNetProfit(
  grossProfit: number,
  totalExpenses: number,
  otherIncome: number
): number {
  return grossProfit - totalExpenses + otherIncome;
}

export function calculateLoanEligibility(
  totalAssets: number,
  totalLiabilities: number,
  marginPercentage: number = 25
): number {
  const netWorth = totalAssets - totalLiabilities;
  const eligibleAmount = netWorth * (1 - marginPercentage / 100);
  return Math.max(0, eligibleAmount);
}

/** @deprecated legacy 3-column shape — use totalsByColumn */
export function calculateTotalAssets(
  items: { previousYear: number; currentYear: number; projectedYear: number }[]
): { previousYear: number; currentYear: number; projectedYear: number } {
  return items.reduce(
    (acc, item) => ({
      previousYear: acc.previousYear + (item.previousYear || 0),
      currentYear: acc.currentYear + (item.currentYear || 0),
      projectedYear: acc.projectedYear + (item.projectedYear || 0),
    }),
    { previousYear: 0, currentYear: 0, projectedYear: 0 }
  );
}

export function totalsByColumn(
  items: { values: YearValues }[],
  colIds: string[]
): Record<string, number> {
  const o: Record<string, number> = {};
  for (const id of colIds) {
    o[id] = items.reduce((s, x) => s + (x.values[id] ?? 0), 0);
  }
  return o;
}

export function calculateRatios(
  netProfit: number,
  netSales: number,
  totalAssets: number,
  totalLiabilities: number
) {
  const netWorth = totalAssets - totalLiabilities;
  return {
    netProfitMargin: netSales > 0 ? ((netProfit / netSales) * 100).toFixed(2) : "0.00",
    debtEquityRatio: netWorth > 0 ? (totalLiabilities / netWorth).toFixed(2) : "N/A",
    currentRatio: totalLiabilities > 0 ? (totalAssets / totalLiabilities).toFixed(2) : "N/A",
    returnOnEquity: netWorth > 0 ? ((netProfit / netWorth) * 100).toFixed(2) : "N/A",
  };
}

export function formatCurrency(value: number, currency: string = "INR"): string {
  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(Math.round(value * 100) / 100);
}

export function formatMoney(value: number, mode: MoneyFormat): string {
  if (mode === "lakhs") return `${(value / 1e5).toFixed(2)}`;
  if (mode === "crores") return `${(value / 1e7).toFixed(2)}`;
  if (mode === "no_decimals") return formatNumber(Math.round(value));
  return formatNumber(value);
}

export interface RepaymentRow {
  installment: number;
  opening: number;
  principal: number;
  interest: number;
  paid: number;
  closing: number;
}

export function buildTermLoanRepayment(loan: OldTermLoan): RepaymentRow[] {
  const monthsTotal = Math.min(84, Math.max(1, Math.ceil(loan.yearsRemaining * 12)));
  const rows: RepaymentRow[] = [];
  let bal = loan.outstanding;
  const monthlyR = loan.interestRate / 100 / 12;
  const emi = loan.monthlyEmi;
  for (let m = 1; m <= monthsTotal && bal > 0.5; m++) {
    const interest = bal * monthlyR;
    let principal = emi - interest;
    if (principal < 0) principal = 0;
    if (principal > bal) principal = bal;
    const paid = principal + interest;
    const closing = Math.max(0, bal - principal);
    rows.push({ installment: m, opening: bal, principal, interest, paid, closing });
    bal = closing;
  }
  return rows;
}

export function simpleDSCR(cashProfit: number, annualDebtService: number): number {
  if (annualDebtService <= 0) return 0;
  return cashProfit / annualDebtService;
}

export function mpblWorkingCapital(tca: number, otherCl: number, marginPct: number) {
  const wcg = tca - otherCl;
  const minNwc = (marginPct / 100) * Math.max(0, wcg);
  const mpbl = Math.max(0, wcg - minNwc);
  return { tca, otherCl, wcg, minNwc, mpbl };
}

export function scenarioScale(base: number, pct: number): number {
  return base * (1 + pct / 100);
}

export interface RatioSeriesRow {
  name: string;
  values: Record<string, string>;
}

export function buildExtendedRatioRows(
  colIds: string[],
  pick: (col: string) => {
    pat: number;
    sales: number;
    assets: number;
    liab: number;
    equity: number;
    ebitda: number;
    interest: number;
  }
): RatioSeriesRow[] {
  const rows: RatioSeriesRow[] = [];
  const names = [
    "Debt–equity ratio",
    "Net profit margin %",
    "Interest coverage (times)",
    "Return on net worth %",
    "Asset turnover (sales/assets)",
  ];
  for (const name of names) {
    const values: Record<string, string> = {};
    for (const col of colIds) {
      const x = pick(col);
      let v = "—";
      if (name === "Debt–equity ratio")
        v = x.equity > 0 ? (x.liab / x.equity).toFixed(2) : "—";
      if (name === "Net profit margin %")
        v = x.sales > 0 ? ((x.pat / x.sales) * 100).toFixed(2) : "0";
      if (name === "Interest coverage (times)")
        v = x.interest > 0 ? (x.ebitda / x.interest).toFixed(2) : "—";
      if (name === "Return on net worth %")
        v = x.equity > 0 ? ((x.pat / x.equity) * 100).toFixed(2) : "—";
      if (name === "Asset turnover (sales/assets)")
        v = x.assets > 0 ? (x.sales / x.assets).toFixed(2) : "—";
      values[col] = v;
    }
    rows.push({ name, values });
  }
  return rows;
}

/** Simplified operating cash flow (per column) for preview */
export function roughOperatingCashflow(
  pat: number,
  depreciation: number,
  deltaWc: number
): number {
  return pat + depreciation - deltaWc;
}
