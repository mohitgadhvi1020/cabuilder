"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useCMAStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  formatCurrency,
  formatMoney,
  totalsByColumn,
  buildExtendedRatioRows,
  buildTermLoanRepayment,
  simpleDSCR,
  mpblWorkingCapital,
  scenarioScale,
  roughOperatingCashflow,
} from "@/lib/calculations";
import { deriveOperatingRows } from "@/lib/operatingDerived";
import { formatOperatingGrowthLabel } from "@/lib/operatingGrowth";
import { ArrowLeft, Download } from "lucide-react";
import { downloadReportPdf } from "@/lib/pdfExport";
import { cn } from "@/lib/cn";

interface ReportPreviewProps {
  backHref: string;
}

/* ── helpers ─────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 pb-1.5 border-b-2 border-[#1e3a5f]">
      <h3 className="text-[12px] font-bold text-[#1e3a5f] uppercase tracking-wide">{children}</h3>
    </div>
  );
}

function PageFooter({ company, auditor, pageNum }: { company: string; auditor: string; pageNum: number }) {
  return (
    <div className="a4-page-footer">
      <span>{company}</span>
      <span>{auditor}</span>
      <span className="a4-page-number">Page {pageNum}</span>
    </div>
  );
}

/** Grouped vertical bar chart (Net Sales vs Net Profit) — pure CSS, html2canvas-safe. */
function TrendChart({
  data,
  fmt,
}: {
  data: { label: string; sales: number; profit: number }[];
  fmt: (v: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.sales, d.profit)));
  return (
    <div className="mt-6 pt-4 border-t border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[11px] font-bold text-[#1e3a5f] uppercase tracking-wider">
          Performance Trend
        </h4>
        <div className="flex items-center gap-4 text-[9px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-[#1e3a5f]" /> Net Sales
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-[#7fa8d4]" /> Net Profit
          </span>
        </div>
      </div>
      <div className="flex items-end justify-between gap-2" style={{ height: "150px" }}>
        {data.map((d) => (
          <div key={d.label} className="flex-1 flex flex-col items-center justify-end h-full">
            <div className="flex items-end gap-1 w-full justify-center" style={{ height: "120px" }}>
              <div
                className="w-1/3 rounded-t-sm bg-[#1e3a5f] relative"
                style={{ height: `${Math.max(2, (d.sales / max) * 100)}%` }}
                title={fmt(d.sales)}
              />
              <div
                className="w-1/3 rounded-t-sm bg-[#7fa8d4] relative"
                style={{ height: `${Math.max(2, (d.profit / max) * 100)}%` }}
                title={fmt(d.profit)}
              />
            </div>
            <span className="text-[7.5px] text-slate-500 mt-1.5 text-center leading-tight">
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── main component ─────────────────────── */

export function ReportPreview({ backHref }: ReportPreviewProps) {
  const formData = useCMAStore((s) => s.formData);
  const yearColumns = useCMAStore((s) => s.yearColumns);
  const { companyDetails, settings, businessProfile, loanDetails, workingCapital, oldTermLoans, coverSettings } =
    formData;

  const colIds = useMemo(() => yearColumns.map((c) => c.id), [yearColumns]);
  const nCols = colIds.length;

  const derived = useMemo(
    () => deriveOperatingRows(formData.operatingStatement, colIds),
    [formData.operatingStatement, colIds]
  );

  const assetTotals = useMemo(() => totalsByColumn(formData.assets, colIds), [formData.assets, colIds]);
  const liabTotals = useMemo(() => totalsByColumn(formData.liabilities, colIds), [formData.liabilities, colIds]);

  const midCol = colIds[Math.min(1, colIds.length - 1)] ?? colIds[0];
  const npat = derived.find((r) => r.id === "os-21")?.values[midCol] ?? 0;
  const netSales = derived.find((r) => r.id === "os-3")?.values[midCol] ?? 0;

  const ratioRows = useMemo(
    () =>
      buildExtendedRatioRows(colIds, (col) => {
        const get = (id: string) => derived.find((r) => r.id === id)?.values[col] ?? 0;
        const assets = assetTotals[col] ?? 0;
        const liab = liabTotals[col] ?? 0;
        const equity = Math.max(1, assets - liab);
        return {
          pat: get("os-21"),
          sales: get("os-3"),
          assets,
          liab,
          equity,
          ebitda: get("os-17") + get("os-9"),
          interest: Math.max(0.01, get("os-15")),
        };
      }),
    [colIds, derived, assetTotals, liabTotals]
  );

  const annualEmi =
    oldTermLoans.reduce((s, l) => s + l.monthlyEmi, 0) * 12 +
    (workingCapital.totalWcLoan * (workingCapital.interestPct / 100) || 0);
  const dscr = simpleDSCR(
    (derived.find((r) => r.id === "os-21")?.values[midCol] ?? 0) +
      (derived.find((r) => r.id === "os-9")?.values[midCol] ?? 0),
    annualEmi || 1
  );

  const mpbl1 = mpblWorkingCapital(
    workingCapital.closingStock + workingCapital.receivables,
    workingCapital.payables,
    25
  );
  const mpbl2 = mpblWorkingCapital(
    workingCapital.closingStock + workingCapital.receivables,
    workingCapital.payables,
    20
  );

  const repayment = oldTermLoans[0] ? buildTermLoanRepayment(oldTermLoans[0]) : [];

  /** Group the monthly amortization into yearly rows so it fits one page. */
  const repaymentYearly = useMemo(() => {
    const years: {
      year: number;
      opening: number;
      principal: number;
      interest: number;
      paid: number;
      closing: number;
    }[] = [];
    repayment.forEach((r, i) => {
      const y = Math.floor(i / 12);
      if (!years[y]) {
        years[y] = { year: y + 1, opening: r.opening, principal: 0, interest: 0, paid: 0, closing: r.closing };
      }
      years[y].principal += r.principal;
      years[y].interest += r.interest;
      years[y].paid += r.paid;
      years[y].closing = r.closing;
    });
    return years;
  }, [repayment]);

  const fmt = (v: number) => formatMoney(v, settings.moneyFormat);
  const unitNote =
    settings.moneyFormat === "lakhs" || settings.moneyFormat === "crores"
      ? `All figures in ${settings.moneyFormat} (₹)`
      : "Amounts in ₹";

  const infoRows = [
    ["Company Name", companyDetails.name],
    ["Address", companyDetails.address],
    ["Constitution", companyDetails.registrationType || companyDetails.constitution],
    ["Industry / Activity", companyDetails.industry || companyDetails.activity],
    ["Year of Establishment", companyDetails.establishmentYear],
    ["PAN", companyDetails.panNumber],
    ["GST", companyDetails.gstNumber],
    ["Bank", companyDetails.bankName ? `${companyDetails.bankName}, ${companyDetails.branch}` : ""],
    ["IFSC Code", companyDetails.ifscCode],
    ["Email", companyDetails.email],
    ["Phone", companyDetails.phone],
    ["No. of Employees", companyDetails.employmentCount > 0 ? String(companyDetails.employmentCount) : ""],
  ].filter(([, v]) => v);

  const auditorLine = settings.auditorName
    ? `${settings.auditorName}${settings.auditorFirm ? `, ${settings.auditorFirm}` : ""}`
    : "CMA Report Builder";

  /* ── adaptive sizing based on number of year columns ── */
  const dense = nCols >= 6;
  const tblFont = dense ? "text-[10px]" : "text-[11px]";
  const thFont = dense ? "text-[9px]" : "text-[10px]";
  const cellPad = dense ? "px-2 py-[5px]" : "px-3 py-2";
  const thPad = dense ? "px-2 py-2" : "px-3 py-2.5";
  const pagePad = dense ? "12mm 12mm 14mm" : "14mm 16mm 16mm";

  const thCls = cn(
    thPad,
    thFont,
    "font-semibold uppercase tracking-wider border-b border-[#2c5282] bg-[#1e3a5f] text-white whitespace-nowrap"
  );

  let pg = 0;
  const nextPg = () => ++pg;

  return (
    <div className="min-h-screen bg-canvas finline-report-root">
      {/* ── toolbar ── */}
      <header className="no-print sticky top-0 z-50 glass shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 h-8 px-3 rounded-lg text-sm font-medium text-accent hover:bg-slate-100/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <h1 className="text-sm font-semibold text-foreground">CMA Report Preview</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[11px] text-muted-foreground">
              Choose <strong>Save as PDF</strong> in the print dialog
            </span>
            <Button
              size="sm"
              onClick={() => downloadReportPdf(`${companyDetails.name || "cma"}-report.pdf`)}
              className="gap-2 bg-accent hover:bg-accent-hover text-accent-foreground"
            >
              <Download className="w-4 h-4" />
              Save as PDF
            </Button>
          </div>
        </div>
      </header>

      <main
        id="cma-report-print-root"
        className="py-8 space-y-6 flex flex-col items-center print:space-y-0 print:py-0"
      >
        {/* ═══════════ PAGE 1 — COVER ═══════════ */}
        <div className="a4-page" style={{ padding: 0 }}>
          <div
            className="a4-page-content relative overflow-hidden text-white"
            style={{
              background:
                "linear-gradient(150deg, #14253f 0%, #1e3a5f 45%, #2c5282 100%)",
            }}
          >
            {/* decorative geometry */}
            <div className="absolute inset-0" style={{ opacity: 0.12 }}>
              <div className="absolute -right-24 -top-24 w-[280px] h-[280px] rounded-full border-[24px] border-white/40" />
              <div className="absolute right-10 top-40 w-[140px] h-[140px] rounded-full border-[14px] border-white/30" />
              <div className="absolute -left-16 bottom-24 w-[220px] h-[220px] rounded-full border-[18px] border-white/30" />
            </div>

            <div className="relative z-10 flex flex-col h-full px-[20mm] py-[22mm]">
              {/* top: eyebrow + auditor */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] tracking-[0.3em] font-semibold text-white/70 uppercase">
                    Credit Monitoring Arrangement
                  </p>
                  <div className="mt-2 h-[3px] w-16 bg-[#7fa8d4]" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] tracking-widest text-white/60 uppercase">Prepared by</p>
                  <p className="text-[13px] font-semibold text-white/90 mt-0.5">{auditorLine}</p>
                </div>
              </div>

              {/* middle: title + company */}
              <div className="mt-auto mb-auto">
                <p className="text-[40px] font-bold leading-[1.05] tracking-tight">
                  {coverSettings.titleText || "CMA Report"}
                </p>
                <div className="mt-6 pl-4 border-l-4 border-[#7fa8d4]">
                  <p className="text-[24px] font-semibold leading-tight">
                    {companyDetails.name || "Company Name"}
                  </p>
                  {companyDetails.address && (
                    <p className="text-[12px] text-white/70 mt-1 max-w-[120mm]">{companyDetails.address}</p>
                  )}
                </div>
              </div>

              {/* bottom: key facts strip */}
              <div className="mt-auto grid grid-cols-3 gap-4 border-t border-white/20 pt-5">
                {([
                  ["Constitution", companyDetails.registrationType || companyDetails.constitution || "—"],
                  ["Industry", companyDetails.industry || companyDetails.activity || "—"],
                  ["Period", `${yearColumns[0]?.label ?? ""} – ${yearColumns[nCols - 1]?.label ?? ""}`],
                  ["PAN", companyDetails.panNumber || "—"],
                  ["Bank", companyDetails.bankName || "—"],
                  ["Prepared on", new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[8.5px] tracking-widest text-white/50 uppercase">{k}</p>
                    <p className="text-[12px] font-semibold text-white/90 mt-1 truncate">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════ PAGE 2 — COMPANY INFO ═══════════ */}
        {(() => {
          const p = nextPg();
          return (
            <div className="a4-page" style={{ padding: "14mm 16mm 14mm" }}>
              <div className="a4-page-content">
                <SectionTitle>{settings.reportTitle || "CMA Data Report"}</SectionTitle>
                <p className="text-[9px] text-slate-400 mb-3 uppercase tracking-wider">{unitNote}</p>
                <table className="w-full text-[11px]">
                  <tbody>
                    {infoRows.map(([label, value], i) => (
                      <tr key={label} className={cn(i < infoRows.length - 1 && "border-b border-slate-100")}>
                        <td className="py-1.5 pr-4 text-slate-500 w-[160px] font-medium">{label}</td>
                        <td className="py-1.5 text-slate-800 font-medium">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

              {(workingCapital.totalWcLoan > 0 || workingCapital.ownContribution > 0) && (
                <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-2.5">
                  {([
                    ["WC Loan", formatCurrency(workingCapital.totalWcLoan, settings.currency)],
                    ["Own Contribution", formatCurrency(workingCapital.ownContribution, settings.currency)],
                    ["Interest Rate", workingCapital.interestPct > 0 ? `${workingCapital.interestPct}%` : "—"],
                    ["Loan Starting From", workingCapital.loanStartMonth || "—"],
                    ["Tenure", workingCapital.tenureMonths > 0 ? `${workingCapital.tenureMonths} months` : "—"],
                    ["Moratorium Period", workingCapital.moratoriumMonths > 0 ? `${workingCapital.moratoriumMonths} months` : "—"],
                  ] as [string, string][]).filter(([, v]) => v !== "—").map(([k, v]) => (
                    <div key={k}>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider">{k}</p>
                      <p className="text-[11px] font-semibold text-slate-800 mt-0.5">{v}</p>
                    </div>
                  ))}
                </div>
              )}

                {businessProfile.richHtml && (
                  <div className="mt-5 pt-3 border-t border-slate-200">
                    <h4 className="text-[10px] font-bold text-[#1e3a5f] uppercase tracking-wider mb-2">Business Profile</h4>
                    <div
                      className="max-w-none text-[10px] text-slate-700 leading-relaxed [&_h1]:text-[13px] [&_h1]:font-bold [&_h1]:text-[#1e3a5f] [&_h2]:text-[12px] [&_h2]:font-semibold [&_h2]:text-[#1e3a5f] [&_h3]:text-[11px] [&_h3]:font-semibold [&_p]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-0.5"
                      dangerouslySetInnerHTML={{ __html: businessProfile.richHtml }}
                    />
                  </div>
                )}
              </div>
              <PageFooter company={companyDetails.name} auditor={auditorLine} pageNum={p} />
            </div>
          );
        })()}

        {/* ═══════════ PAGE 3 — OPERATING STATEMENT ═══════════ */}
        {(() => {
          const p = nextPg();
          return (
            <div className="a4-page" style={{ padding: pagePad }}>
              <div className="a4-page-content">
                <SectionTitle>Operating Statement</SectionTitle>
                <table className={cn("w-full border-collapse", tblFont)} style={{ tableLayout: "fixed" }}>
                  <colgroup>
                    <col style={{ width: dense ? "120px" : "160px" }} />
                    <col style={{ width: dense ? "38px" : "48px" }} />
                    {colIds.map((id) => (
                      <col key={id} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      <th className={cn(thCls, "text-left")}>Particulars</th>
                      <th className={cn(thCls, "text-right")}>% YoY</th>
                      {yearColumns.map((c) => (
                        <th key={c.id} className={cn(thCls, "text-right")}>
                          <span className="block">{c.label}</span>
                          <span className={cn("font-normal text-blue-100/80 capitalize", dense ? "text-[6.5px]" : "text-[7px]")}>{c.kind}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {derived.map((row, idx) => (
                      <tr
                        key={row.id}
                        className={cn(
                          "border-b border-slate-100",
                          row.isHeader && "bg-[#f0f4f8]",
                          row.isTotal && "bg-[#f8fafc] font-semibold",
                          !row.isHeader && !row.isTotal && idx % 2 === 0 && "bg-white",
                          !row.isHeader && !row.isTotal && idx % 2 !== 0 && "bg-slate-50/40"
                        )}
                      >
                        <td
                          className={cn(
                            cellPad,
                            "text-left text-slate-800 truncate",
                            row.isHeader && "font-bold text-[#1e3a5f] uppercase tracking-wider pt-1.5",
                            row.isHeader && (dense ? "text-[7.5px]" : "text-[8.5px]"),
                            row.isTotal && "text-[#1e3a5f] font-bold",
                            row.indent && (dense ? "pl-3" : "pl-4")
                          )}
                        >
                          {row.label}
                        </td>
                        <td className={cn(cellPad, "text-right font-mono text-slate-500", dense ? "text-[7.5px]" : "text-[8px]")}>
                          {formatOperatingGrowthLabel(row, colIds)}
                        </td>
                        {colIds.map((id) => (
                          <td
                            key={id}
                            className={cn(
                              cellPad,
                              "text-right font-mono text-slate-800",
                              row.isTotal && "text-[#1e3a5f] font-bold"
                            )}
                          >
                            {row.isHeader ? "" : fmt(row.values[id] ?? 0)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <TrendChart
                  fmt={fmt}
                  data={yearColumns.map((c) => ({
                    label: c.label,
                    sales: derived.find((r) => r.id === "os-3")?.values[c.id] ?? 0,
                    profit: derived.find((r) => r.id === "os-21")?.values[c.id] ?? 0,
                  }))}
                />
              </div>
              <PageFooter company={companyDetails.name} auditor={auditorLine} pageNum={p} />
            </div>
          );
        })()}

        {/* ═══════════ PAGE 4 — BALANCE SHEET ═══════════ */}
        {(() => {
          const p = nextPg();
          return (
            <div className="a4-page" style={{ padding: pagePad }}>
              <div className="a4-page-content">
                <SectionTitle>Balance Sheet — Assets</SectionTitle>
                <table className={cn("w-full border-collapse", tblFont)} style={{ tableLayout: "fixed" }}>
                  <colgroup>
                    <col style={{ width: dense ? "130px" : "170px" }} />
                    {colIds.map((id) => (
                      <col key={id} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      <th className={cn(thCls, "text-left")}>Particular</th>
                      {yearColumns.map((c) => (
                        <th key={c.id} className={cn(thCls, "text-right")}>{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {formData.assets.map((a, idx) => (
                      <tr key={a.id} className={cn("border-b border-slate-100", idx % 2 === 0 ? "bg-white" : "bg-slate-50/40")}>
                        <td className={cn(cellPad, "text-slate-800 font-medium truncate")}>{a.particular || "—"}</td>
                        {colIds.map((id) => (
                          <td key={id} className={cn(cellPad, "text-right font-mono text-slate-800")}>{fmt(a.values[id] ?? 0)}</td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-[#f0f4f8] font-bold border-t-2 border-[#1e3a5f]">
                      <td className={cn(cellPad, "text-[#1e3a5f]")}>Total Assets</td>
                      {colIds.map((id) => (
                        <td key={id} className={cn(cellPad, "text-right font-mono text-[#1e3a5f]")}>{fmt(assetTotals[id] ?? 0)}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>

                <div className="mt-5">
                  <SectionTitle>Balance Sheet — Liabilities</SectionTitle>
                  <table className={cn("w-full border-collapse", tblFont)} style={{ tableLayout: "fixed" }}>
                    <colgroup>
                      <col style={{ width: dense ? "130px" : "170px" }} />
                      {colIds.map((id) => (
                        <col key={id} />
                      ))}
                    </colgroup>
                    <thead>
                      <tr>
                        <th className={cn(thCls, "text-left")}>Particular</th>
                        {yearColumns.map((c) => (
                          <th key={c.id} className={cn(thCls, "text-right")}>{c.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {formData.liabilities.map((l, idx) => (
                        <tr key={l.id} className={cn("border-b border-slate-100", idx % 2 === 0 ? "bg-white" : "bg-slate-50/40")}>
                          <td className={cn(cellPad, "text-slate-800 font-medium truncate")}>{l.particular || "—"}</td>
                          {colIds.map((id) => (
                            <td key={id} className={cn(cellPad, "text-right font-mono text-slate-800")}>{fmt(l.values[id] ?? 0)}</td>
                          ))}
                        </tr>
                      ))}
                      <tr className="bg-[#f0f4f8] font-bold border-t-2 border-[#1e3a5f]">
                        <td className={cn(cellPad, "text-[#1e3a5f]")}>Total Liabilities</td>
                        {colIds.map((id) => (
                          <td key={id} className={cn(cellPad, "text-right font-mono text-[#1e3a5f]")}>{fmt(liabTotals[id] ?? 0)}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <PageFooter company={companyDetails.name} auditor={auditorLine} pageNum={p} />
            </div>
          );
        })()}

        {/* ═══════════ PAGE 5 — CASH FLOW + RATIOS ═══════════ */}
        {(() => {
          const p = nextPg();
          return (
            <div className="a4-page" style={{ padding: pagePad }}>
              <div className="a4-page-content">
                <SectionTitle>Cash Flow Statement (Simplified)</SectionTitle>
                <table className={cn("w-full border-collapse", tblFont)} style={{ tableLayout: "fixed" }}>
                  <colgroup>
                    <col style={{ width: dense ? "130px" : "170px" }} />
                    {colIds.map((id) => (
                      <col key={id} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      <th className={cn(thCls, "text-left")}>Particulars</th>
                      {yearColumns.map((c) => (
                        <th key={c.id} className={cn(thCls, "text-right")}>{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "Profit After Tax", getId: "os-21" },
                      { label: "Depreciation", getId: "os-9" },
                    ].map((item) => (
                      <tr key={item.label} className="border-b border-slate-100">
                        <td className={cn(cellPad, "text-slate-800")}>{item.label}</td>
                        {colIds.map((id) => (
                          <td key={id} className={cn(cellPad, "text-right font-mono text-slate-800")}>
                            {fmt(derived.find((r) => r.id === item.getId)?.values[id] ?? 0)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-[#f0f4f8] font-bold border-t-2 border-[#1e3a5f]">
                      <td className={cn(cellPad, "text-[#1e3a5f]")}>Operating Cash Flow</td>
                      {colIds.map((id) => {
                        const pat = derived.find((r) => r.id === "os-21")?.values[id] ?? 0;
                        const dep = derived.find((r) => r.id === "os-9")?.values[id] ?? 0;
                        return (
                          <td key={id} className={cn(cellPad, "text-right font-mono text-[#1e3a5f]")}>
                            {fmt(roughOperatingCashflow(pat, dep, 0))}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>

                <div className="mt-5">
                  <SectionTitle>Key Financial Ratios</SectionTitle>
                  <table className={cn("w-full border-collapse", tblFont)} style={{ tableLayout: "fixed" }}>
                    <colgroup>
                      <col style={{ width: dense ? "130px" : "170px" }} />
                      {colIds.map((id) => (
                        <col key={id} />
                      ))}
                    </colgroup>
                    <thead>
                      <tr>
                        <th className={cn(thCls, "text-left")}>Ratio</th>
                        {yearColumns.map((c) => (
                          <th key={c.id} className={cn(thCls, "text-right")}>{c.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ratioRows.map((r, idx) => (
                        <tr key={r.name} className={cn("border-b border-slate-100", idx % 2 === 0 ? "bg-white" : "bg-slate-50/40")}>
                          <td className={cn(cellPad, "text-slate-800 font-medium truncate")}>{r.name}</td>
                          {colIds.map((id) => (
                            <td key={id} className={cn(cellPad, "text-right font-mono text-slate-800")}>{r.values[id]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <PageFooter company={companyDetails.name} auditor={auditorLine} pageNum={p} />
            </div>
          );
        })()}

        {/* ═══════════ PAGE 6 — DSCR + MPBL + SENSITIVITY ═══════════ */}
        {(() => {
          const p = nextPg();
          return (
            <div className="a4-page" style={{ padding: "14mm 16mm 14mm" }}>
              <div className="a4-page-content">
                <SectionTitle>Credit Assessment & Bank Finance</SectionTitle>

                {/* KPI hero cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {([
                    ["DSCR", dscr.toFixed(2), "Debt Service Coverage", dscr >= 1.5 ? "Healthy" : dscr >= 1 ? "Adequate" : "Below benchmark", dscr >= 1.25],
                    ["Current Ratio", (liabTotals[midCol] ? (assetTotals[midCol] / liabTotals[midCol]) : 0).toFixed(2), "Liquidity position", "Benchmark ≥ 1.33", (assetTotals[midCol] / Math.max(1, liabTotals[midCol])) >= 1.33],
                    ["Net Profit Margin", `${netSales ? ((npat / netSales) * 100).toFixed(1) : "0.0"}%`, "Profitability", "PAT / Net Sales", (netSales ? (npat / netSales) : 0) >= 0.05],
                  ] as [string, string, string, string, boolean][]).map(([label, val, sub, note, good]) => (
                    <div key={label} className="rounded-lg border border-[#dce3ec] bg-gradient-to-b from-slate-50 to-white p-4">
                      <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                      <p className="text-[28px] font-bold text-[#1e3a5f] leading-none mt-2">{val}</p>
                      <p className="text-[9px] text-slate-500 mt-2">{sub}</p>
                      <p className={cn("text-[9px] font-semibold mt-1", good ? "text-emerald-600" : "text-amber-600")}>
                        {good ? "● " : "○ "}{note}
                      </p>
                    </div>
                  ))}
                </div>

                {/* MPBF computation table — Tandon Method I & II */}
                <SectionTitle>MPBF — Maximum Permissible Bank Finance</SectionTitle>
                <table className={cn("w-full border-collapse mb-6", tblFont)} style={{ tableLayout: "fixed" }}>
                  <colgroup>
                    <col /><col style={{ width: "26%" }} /><col style={{ width: "26%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className={cn(thCls, "text-left")}>Particulars</th>
                      <th className={cn(thCls, "text-right")}>Method I (25% margin)</th>
                      <th className={cn(thCls, "text-right")}>Method II (20% margin)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {([
                      ["Total Current Assets", mpbl1.tca, mpbl2.tca, false],
                      ["Less: Other Current Liabilities", mpbl1.otherCl, mpbl2.otherCl, false],
                      ["Working Capital Gap (WCG)", mpbl1.wcg, mpbl2.wcg, false],
                      ["Less: Min. Stipulated NWC", mpbl1.minNwc, mpbl2.minNwc, false],
                      ["Maximum Permissible Bank Finance", mpbl1.mpbl, mpbl2.mpbl, true],
                    ] as [string, number, number, boolean][]).map(([label, a, b, total], idx) => (
                      <tr key={label} className={cn("border-b border-slate-100", total ? "bg-[#f0f4f8] border-t-2 border-[#1e3a5f]" : idx % 2 === 0 ? "bg-white" : "bg-slate-50/40")}>
                        <td className={cn(cellPad, total ? "font-bold text-[#1e3a5f]" : "text-slate-800")}>{label}</td>
                        <td className={cn(cellPad, "text-right font-mono", total ? "font-bold text-[#1e3a5f]" : "text-slate-800")}>{fmt(a)}</td>
                        <td className={cn(cellPad, "text-right font-mono", total ? "font-bold text-[#1e3a5f]" : "text-slate-800")}>{fmt(b)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <SectionTitle>Sensitivity Analysis (Stress Scenarios)</SectionTitle>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    ["+5% Sales", 5, false],
                    ["−5% Sales", -5, false],
                    ["+5% RM Cost", 0, true],
                  ] as const).map(([label, sp, isRm]) => {
                    const base = derived.find((r) => r.id === "os-3")?.values[midCol] ?? 0;
                    const rm = derived.find((r) => r.id === "os-5")?.values[midCol] ?? 0;
                    const adjSales = sp === 0 ? base : scenarioScale(base, sp);
                    const adjRm = isRm ? scenarioScale(rm, 5) : rm;
                    return (
                      <div key={label} className="rounded-lg border border-[#dce3ec] p-3.5 bg-slate-50/50">
                        <p className="text-[10px] font-bold text-[#1e3a5f] uppercase tracking-wider mb-2.5">{label}</p>
                        <div className="space-y-1.5 text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Net Sales</span>
                            <span className="font-mono font-medium text-slate-800">{fmt(adjSales)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">RM Cost</span>
                            <span className="font-mono font-medium text-slate-800">{fmt(adjRm)}</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-200 pt-1.5 mt-1">
                            <span className="text-slate-600 font-medium">Gross Margin</span>
                            <span className="font-mono font-bold text-[#1e3a5f]">{fmt(adjSales - adjRm)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <PageFooter company={companyDetails.name} auditor={auditorLine} pageNum={p} />
            </div>
          );
        })()}

        {/* ═══════════ PAGE 7 (conditional) — TERM LOAN REPAYMENT ═══════════ */}
        {repayment.length > 0 &&
          (() => {
            const p = nextPg();
            return (
              <div className="a4-page" style={{ padding: pagePad }}>
                <div className="a4-page-content">
                  <SectionTitle>Term Loan Repayment Schedule (Year-wise)</SectionTitle>
                  <table className={cn("w-full border-collapse", tblFont)} style={{ tableLayout: "fixed" }}>
                    <colgroup>
                      <col style={{ width: "60px" }} />
                      <col /><col /><col /><col /><col />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className={cn(thCls, "text-left")}>Year</th>
                        <th className={cn(thCls, "text-right")}>Opening Bal.</th>
                        <th className={cn(thCls, "text-right")}>Principal</th>
                        <th className={cn(thCls, "text-right")}>Interest</th>
                        <th className={cn(thCls, "text-right")}>Total Paid</th>
                        <th className={cn(thCls, "text-right")}>Closing Bal.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repaymentYearly.map((r, idx) => (
                        <tr key={r.year} className={cn("border-b border-slate-100", idx % 2 === 0 ? "bg-white" : "bg-slate-50/40")}>
                          <td className={cn(cellPad, "text-slate-800 font-medium")}>Year {r.year}</td>
                          <td className={cn(cellPad, "text-right font-mono text-slate-800")}>{fmt(r.opening)}</td>
                          <td className={cn(cellPad, "text-right font-mono text-slate-800")}>{fmt(r.principal)}</td>
                          <td className={cn(cellPad, "text-right font-mono text-slate-800")}>{fmt(r.interest)}</td>
                          <td className={cn(cellPad, "text-right font-mono text-slate-800")}>{fmt(r.paid)}</td>
                          <td className={cn(cellPad, "text-right font-mono text-slate-800")}>{fmt(r.closing)}</td>
                        </tr>
                      ))}
                      <tr className="bg-[#f0f4f8] font-bold border-t-2 border-[#1e3a5f]">
                        <td className={cn(cellPad, "text-[#1e3a5f]")}>Total</td>
                        <td className={cn(cellPad)} />
                        <td className={cn(cellPad, "text-right font-mono text-[#1e3a5f]")}>{fmt(repaymentYearly.reduce((s, r) => s + r.principal, 0))}</td>
                        <td className={cn(cellPad, "text-right font-mono text-[#1e3a5f]")}>{fmt(repaymentYearly.reduce((s, r) => s + r.interest, 0))}</td>
                        <td className={cn(cellPad, "text-right font-mono text-[#1e3a5f]")}>{fmt(repaymentYearly.reduce((s, r) => s + r.paid, 0))}</td>
                        <td className={cn(cellPad)} />
                      </tr>
                    </tbody>
                  </table>
                </div>
                <PageFooter company={companyDetails.name} auditor={auditorLine} pageNum={p} />
              </div>
            );
          })()}

        {/* ═══════════ PAGE 8 (conditional) — BANKING FACILITIES ═══════════ */}
        {loanDetails.length > 0 &&
          (() => {
            const p = nextPg();
            return (
              <div className="a4-page" style={{ padding: pagePad }}>
                <div className="a4-page-content">
                  <SectionTitle>Existing Banking Facilities</SectionTitle>
                  <table className={cn("w-full border-collapse", tblFont)} style={{ tableLayout: "fixed" }}>
                    <colgroup>
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "18%" }} />
                      <col style={{ width: "18%" }} />
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "32%" }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className={cn(thCls, "text-left")}>Facility Type</th>
                        <th className={cn(thCls, "text-right")}>Sanctioned Limit</th>
                        <th className={cn(thCls, "text-right")}>Outstanding</th>
                        <th className={cn(thCls, "text-right")}>Interest Rate</th>
                        <th className={cn(thCls, "text-left")}>Security</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loanDetails.map((l, idx) => (
                        <tr key={l.id} className={cn("border-b border-slate-100", idx % 2 === 0 ? "bg-white" : "bg-slate-50/40")}>
                          <td className={cn(cellPad, "text-slate-800 font-medium")}>{l.facilityType}</td>
                          <td className={cn(cellPad, "text-right font-mono text-slate-800")}>{formatCurrency(l.sanctionedLimit, settings.currency)}</td>
                          <td className={cn(cellPad, "text-right font-mono text-slate-800")}>{formatCurrency(l.outstanding, settings.currency)}</td>
                          <td className={cn(cellPad, "text-right font-mono text-slate-800")}>{l.interestRate}%</td>
                          <td className={cn(cellPad, "text-slate-600 text-[8px]")}>{l.securityDetails || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PageFooter company={companyDetails.name} auditor={auditorLine} pageNum={p} />
              </div>
            );
          })()}

        {/* ═══════════ LAST PAGE — SUMMARY ═══════════ */}
        {(() => {
          const p = nextPg();
          return (
            <div className="a4-page" style={{ padding: "14mm 16mm 14mm" }}>
              <div className="a4-page-content">
                <SectionTitle>Executive Summary</SectionTitle>

                <p className="text-[10.5px] text-slate-600 leading-relaxed mb-5">
                  This Credit Monitoring Arrangement report presents the financial position and projections
                  of <span className="font-semibold text-slate-800">{companyDetails.name || "the borrower"}</span>
                  {companyDetails.industry ? ` (${companyDetails.industry})` : ""} for the period
                  {" "}<span className="font-semibold text-slate-800">{yearColumns[0]?.label} to {yearColumns[nCols - 1]?.label}</span>.
                  {workingCapital.totalWcLoan > 0 && (
                    <> The borrower seeks working-capital finance of
                    {" "}<span className="font-semibold text-slate-800">{formatCurrency(workingCapital.totalWcLoan, settings.currency)}</span>.</>
                  )}
                </p>

                <div className="grid grid-cols-3 gap-3.5 mb-5">
                  {([
                    ["Net Profit Margin", `${netSales ? ((npat / netSales) * 100).toFixed(1) : "0.0"}%`],
                    ["DSCR", dscr.toFixed(2)],
                    ["Current Ratio", (assetTotals[midCol] / Math.max(1, liabTotals[midCol])).toFixed(2)],
                    ["Total Assets", fmt(assetTotals[midCol] ?? 0)],
                    ["Net Worth", fmt((assetTotals[midCol] ?? 0) - (liabTotals[midCol] ?? 0))],
                    ["WC Finance Sought", workingCapital.totalWcLoan > 0 ? fmt(workingCapital.totalWcLoan) : "—"],
                  ] as [string, string][]).map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-[#dce3ec] bg-slate-50/60 p-3.5">
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider">{k}</p>
                      <p className="text-[20px] font-bold text-[#1e3a5f] mt-1.5 leading-none">{v}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-[#1e3a5f]/20 bg-[#f0f4f8] p-4">
                  <p className="text-[10px] font-bold text-[#1e3a5f] uppercase tracking-wider mb-2">Banker&apos;s Assessment</p>
                  <ul className="space-y-1.5 text-[10px] text-slate-600 list-none">
                    <li className="flex gap-2">
                      <span className="text-[#1e3a5f]">●</span>
                      Net sales are projected to grow steadily across the period, with net profit margin maintained at {netSales ? ((npat / netSales) * 100).toFixed(1) : "0.0"}%.
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#1e3a5f]">●</span>
                      DSCR of {dscr.toFixed(2)} indicates {dscr >= 1.5 ? "comfortable" : dscr >= 1 ? "adequate" : "tight"} debt-servicing capacity against the proposed obligations.
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#1e3a5f]">●</span>
                      The working-capital gap supports the assessed MPBF; current-ratio and net-worth trends are consistent with the projections.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="a4-page-footer flex-col gap-3">
                <div className="flex justify-between text-[9px] text-slate-400 w-full">
                  <div>
                    <p className="font-medium text-slate-600">{companyDetails.name}</p>
                    <p>NPM: {netSales ? ((npat / netSales) * 100).toFixed(2) : "0.00"}% · DSCR: {dscr.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p>{auditorLine}</p>
                    <p>Prepared on {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                  </div>
                </div>
                <div className="a4-page-number w-full text-right">Page {p}</div>
              </div>
            </div>
          );
        })()}
      </main>
    </div>
  );
}
