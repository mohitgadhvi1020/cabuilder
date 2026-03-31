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
import { ArrowLeft, Download, Printer } from "lucide-react";
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
    ["Email", companyDetails.email],
    ["Phone", companyDetails.phone],
    ["No. of Employees", companyDetails.employmentCount > 0 ? String(companyDetails.employmentCount) : ""],
  ].filter(([, v]) => v);

  const auditorLine = settings.auditorName
    ? `${settings.auditorName}${settings.auditorFirm ? `, ${settings.auditorFirm}` : ""}`
    : "CMA Report Builder";

  /* ── adaptive sizing based on number of year columns ── */
  const dense = nCols >= 6;
  const tblFont = dense ? "text-[8.5px]" : "text-[10px]";
  const thFont = dense ? "text-[8px]" : "text-[9px]";
  const cellPad = dense ? "px-1 py-0.5" : "px-2 py-1";
  const thPad = dense ? "px-1 py-1.5" : "px-2 py-2";
  const pagePad = dense ? "10mm 10mm 14mm" : "14mm 16mm 18mm";

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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2 border-card-border">
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button
              size="sm"
              onClick={() => downloadReportPdf(`${companyDetails.name || "cma"}-report.pdf`)}
              className="gap-2 bg-accent hover:bg-accent-hover text-accent-foreground"
            >
              <Download className="w-4 h-4" />
              Download PDF
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
          <div className="a4-page-content relative flex flex-col justify-between overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverSettings.coverTemplate || "/covers/cover-1.svg"}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />
            <div className="relative z-10 flex flex-col justify-between flex-1 p-[16mm]">
              <p
                className="font-bold leading-tight drop-shadow-md"
                style={{
                  fontSize: Math.max(28, coverSettings.fontSize * 0.45),
                  fontWeight: coverSettings.fontWeight,
                  color: coverSettings.fontColor,
                }}
              >
                {coverSettings.titleText}
              </p>
              <div className="space-y-2 mt-auto">
                <p className="text-2xl font-bold drop-shadow-md" style={{ color: coverSettings.fontColor }}>
                  {companyDetails.name || "Company Name"}
                </p>
                {companyDetails.address && (
                  <p className="text-sm opacity-80 drop-shadow" style={{ color: coverSettings.fontColor }}>
                    {companyDetails.address}
                  </p>
                )}
                <p className="text-xs opacity-60 mt-2" style={{ color: coverSettings.fontColor }}>
                  {settings.auditorName
                    ? `Prepared by ${auditorLine}`
                    : `Prepared on ${new Date().toLocaleDateString("en-IN")}`}
                </p>
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
                  <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      ["WC Loan", formatCurrency(workingCapital.totalWcLoan, settings.currency)],
                      ["Own Contribution", formatCurrency(workingCapital.ownContribution, settings.currency)],
                      ["Interest Rate", workingCapital.interestPct > 0 ? `${workingCapital.interestPct}%` : "—"],
                      ["Loan Start", workingCapital.loanStartMonth || "—"],
                    ].map(([k, v]) => (
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
                <SectionTitle>DSCR (Debt Service Coverage Ratio)</SectionTitle>
                <div className="flex items-center gap-4 mb-5">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#1e3a5f]/10">
                    <span className="text-base font-bold text-[#1e3a5f]">{dscr.toFixed(2)}</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-600">Cash Profit / Annual Debt Service</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      {dscr >= 1.5 ? "Healthy — sufficient to cover obligations" : dscr >= 1 ? "Adequate coverage" : "Below benchmark — needs attention"}
                    </p>
                  </div>
                </div>

                <SectionTitle>MPBL (Working Capital)</SectionTitle>
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-1">Method I (25% margin)</p>
                    <div className="flex gap-3 text-[10px]">
                      <span className="text-slate-500">WC Gap: <span className="font-mono font-medium text-slate-800">{fmt(mpbl1.wcg)}</span></span>
                      <span className="text-slate-500">MPBL: <span className="font-mono font-bold text-[#1e3a5f]">{fmt(mpbl1.mpbl)}</span></span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-1">Method II (20% margin)</p>
                    <div className="flex gap-3 text-[10px]">
                      <span className="text-slate-500">MPBL: <span className="font-mono font-bold text-[#1e3a5f]">{fmt(mpbl2.mpbl)}</span></span>
                    </div>
                  </div>
                </div>

                <SectionTitle>Sensitivity Analysis</SectionTitle>
                <div className="grid grid-cols-3 gap-2.5">
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
                      <div key={label} className="rounded border border-[#dce3ec] p-2 bg-slate-50/50">
                        <p className="text-[8px] font-bold text-[#1e3a5f] uppercase tracking-wider mb-1">{label}</p>
                        <div className="space-y-0.5 text-[9px]">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Net Sales</span>
                            <span className="font-mono font-medium text-slate-800">{fmt(adjSales)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">RM Cost</span>
                            <span className="font-mono font-medium text-slate-800">{fmt(adjRm)}</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-200 pt-0.5 mt-0.5">
                            <span className="text-slate-500 font-medium">Gross Margin</span>
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
                  <SectionTitle>Term Loan Repayment Schedule</SectionTitle>
                  <table className={cn("w-full border-collapse", tblFont)} style={{ tableLayout: "fixed" }}>
                    <colgroup>
                      <col style={{ width: "40px" }} />
                      <col /><col /><col /><col /><col />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className={cn(thCls, "text-left")}>Inst.</th>
                        <th className={cn(thCls, "text-right")}>Opening Bal.</th>
                        <th className={cn(thCls, "text-right")}>Principal</th>
                        <th className={cn(thCls, "text-right")}>Interest</th>
                        <th className={cn(thCls, "text-right")}>Total Paid</th>
                        <th className={cn(thCls, "text-right")}>Closing Bal.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repayment.slice(0, 60).map((r, idx) => (
                        <tr key={r.installment} className={cn("border-b border-slate-100", idx % 2 === 0 ? "bg-white" : "bg-slate-50/40")}>
                          <td className={cn(cellPad, "text-slate-800 font-medium")}>{r.installment}</td>
                          <td className={cn(cellPad, "text-right font-mono text-slate-800")}>{fmt(r.opening)}</td>
                          <td className={cn(cellPad, "text-right font-mono text-slate-800")}>{fmt(r.principal)}</td>
                          <td className={cn(cellPad, "text-right font-mono text-slate-800")}>{fmt(r.interest)}</td>
                          <td className={cn(cellPad, "text-right font-mono text-slate-800")}>{fmt(r.paid)}</td>
                          <td className={cn(cellPad, "text-right font-mono text-slate-800")}>{fmt(r.closing)}</td>
                        </tr>
                      ))}
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
                <SectionTitle>Report Summary</SectionTitle>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[10px] mt-3">
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">Company</p>
                    <p className="font-semibold text-slate-800">{companyDetails.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">Industry</p>
                    <p className="font-semibold text-slate-800">{companyDetails.industry || companyDetails.activity || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">Net Profit Margin</p>
                    <p className="font-semibold text-[#1e3a5f]">
                      {netSales ? ((npat / netSales) * 100).toFixed(2) : "0.00"}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">DSCR</p>
                    <p className="font-semibold text-[#1e3a5f]">{dscr.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">Total Assets (mid-year)</p>
                    <p className="font-semibold text-slate-800">{fmt(assetTotals[midCol] ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">Total Liabilities (mid-year)</p>
                    <p className="font-semibold text-slate-800">{fmt(liabTotals[midCol] ?? 0)}</p>
                  </div>
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
