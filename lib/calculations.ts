import { OperatingStatementRow } from "./types";

export function calculateRowTotal(rows: OperatingStatementRow[], ids: string[], field: "previousYear" | "currentYear" | "projectedYear"): number {
  return rows
    .filter((r) => ids.includes(r.id) && !r.isHeader && !r.isTotal)
    .reduce((sum, r) => sum + (r[field] as number || 0), 0);
}

export function calculateGrossProfit(
  netSales: number,
  costOfGoods: number
): number {
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

export function calculateRatios(
  netProfit: number,
  netSales: number,
  totalAssets: number,
  totalLiabilities: number
) {
  const netWorth = totalAssets - totalLiabilities;
  return {
    netProfitMargin: netSales > 0 ? ((netProfit / netSales) * 100).toFixed(2) : "0.00",
    debtEquityRatio: netWorth > 0 ? ((totalLiabilities / netWorth)).toFixed(2) : "N/A",
    currentRatio: totalLiabilities > 0 ? ((totalAssets / totalLiabilities)).toFixed(2) : "N/A",
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
  return new Intl.NumberFormat("en-IN").format(value);
}
