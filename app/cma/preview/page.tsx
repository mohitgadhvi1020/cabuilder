"use client";

import { useCMAStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber, calculateTotalAssets, calculateRatios } from "@/lib/calculations";
import { ArrowLeft, Download, Printer } from "lucide-react";
import Link from "next/link";

export default function PreviewPage() {
  const formData = useCMAStore((s) => s.formData);
  const { companyDetails, loanDetails, settings, businessProfile, operatingStatement, assets, liabilities } = formData;
  const currency = settings.currency || "INR";

  const assetTotals = calculateTotalAssets(assets);
  const liabilityTotals = calculateTotalAssets(liabilities);

  const npatRow = operatingStatement.find((r) => r.id === "os-21");
  const netSalesRow = operatingStatement.find((r) => r.id === "os-3");
  const netProfit = npatRow?.currentYear || 0;
  const netSales = netSalesRow?.currentYear || 0;

  const ratios = calculateRatios(netProfit, netSales, assetTotals.currentYear, liabilityTotals.currentYear);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert("PDF download is triggered via window.print() → Save as PDF in your browser's print dialog.");
    window.print();
  };

  const fmt = (val: number) => formatCurrency(val, currency);

  return (
    <div className="min-h-screen">
      {/* Top bar - hidden on print */}
      <header className="no-print sticky top-0 z-50 glass border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/cma/create">
              <Button variant="ghost" size="sm" className="gap-2 text-slate-400 hover:text-white">
                <ArrowLeft className="w-4 h-4" />
                Back to Editor
              </Button>
            </Link>
            <div className="h-5 w-px bg-slate-700" />
            <h1 className="text-sm font-semibold text-white">Report Preview</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button size="sm" onClick={handleDownload} className="gap-2">
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </header>

      {/* Printable report */}
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        {/* Title Block */}
        <section className="text-center border-b border-slate-700/50 pb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {settings.reportTitle || "CMA Data Report"}
          </h1>
          <p className="text-lg text-blue-400 font-medium">{companyDetails.name}</p>
          <p className="text-sm text-slate-500 mt-1">{companyDetails.address}</p>
          {settings.financialYearStart && settings.financialYearEnd && (
            <p className="text-sm text-slate-400 mt-2">
              Financial Year: {settings.financialYearStart} to {settings.financialYearEnd}
            </p>
          )}
        </section>

        {/* Company Details Section */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-500 rounded-full" />
            Company Details
          </h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {[
              ["Constitution", companyDetails.constitution],
              ["Year of Establishment", companyDetails.establishmentYear],
              ["PAN", companyDetails.panNumber],
              ["GST", companyDetails.gstNumber],
              ["Industry", companyDetails.industry],
              ["Bank", companyDetails.bankName],
              ["Branch", companyDetails.branch],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-slate-800/50">
                <span className="text-slate-400">{label}</span>
                <span className="text-slate-200 font-medium">{value || "—"}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Business Profile */}
        <section className="print-break">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-teal-500 rounded-full" />
            Business Profile
          </h2>
          <div className="space-y-3 text-sm">
            {[
              ["Nature of Business", businessProfile.natureOfBusiness],
              ["Products / Services", businessProfile.productsServices],
              ["Major Customers", businessProfile.majorCustomers],
              ["Major Suppliers", businessProfile.majorSuppliers],
              ["Employees", businessProfile.employeeCount?.toString()],
              ["Experience", businessProfile.experience],
              ["Group Concerns", businessProfile.groupConcerns],
              ["Associate Companies", businessProfile.associateCompanies],
            ].map(([label, value]) => (
              <div key={label} className="border-b border-slate-800/50 pb-2">
                <span className="text-slate-400 text-xs uppercase tracking-wider">{label}</span>
                <p className="text-slate-200 mt-0.5">{value || "—"}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Loan Details */}
        {loanDetails.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-purple-500 rounded-full" />
              Banking Facilities
            </h2>
            <div className="overflow-x-auto rounded-lg border border-slate-700/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800/80 text-slate-400">
                    <th className="text-left px-4 py-3 font-medium">Facility</th>
                    <th className="text-right px-4 py-3 font-medium">Limit ({currency})</th>
                    <th className="text-right px-4 py-3 font-medium">Outstanding ({currency})</th>
                    <th className="text-right px-4 py-3 font-medium">Rate (%)</th>
                    <th className="text-left px-4 py-3 font-medium">Security</th>
                  </tr>
                </thead>
                <tbody>
                  {loanDetails.map((loan) => (
                    <tr key={loan.id} className="border-t border-slate-800">
                      <td className="px-4 py-3 text-slate-200">{loan.facilityType}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">{fmt(loan.sanctionedLimit)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">{fmt(loan.outstanding)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">{loan.interestRate}%</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{loan.securityDetails}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Operating Statement */}
        <section className="print-break">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-cyan-500 rounded-full" />
            Operating Statement
          </h2>
          <div className="overflow-x-auto rounded-lg border border-slate-700/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/80 text-slate-400">
                  <th className="text-left px-4 py-3 font-medium w-[40%]">Particulars</th>
                  <th className="text-right px-4 py-3 font-medium">Previous Year</th>
                  <th className="text-right px-4 py-3 font-medium">Current Year</th>
                  <th className="text-right px-4 py-3 font-medium">Projected Year</th>
                </tr>
              </thead>
              <tbody>
                {operatingStatement.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-t border-slate-800/50 ${
                      row.isHeader ? "bg-slate-800/40" : ""
                    } ${row.isTotal ? "bg-slate-800/20 font-semibold" : ""}`}
                  >
                    <td
                      className={`px-4 py-2 ${
                        row.isHeader
                          ? "text-blue-400 font-bold uppercase text-xs tracking-wider pt-4"
                          : row.isTotal
                          ? "text-white"
                          : "text-slate-300"
                      }`}
                    >
                      {row.label}
                    </td>
                    {!row.isHeader ? (
                      <>
                        <td className={`px-4 py-2 text-right font-mono ${row.isTotal ? "text-emerald-400" : "text-slate-400"}`}>
                          {formatNumber(row.previousYear)}
                        </td>
                        <td className={`px-4 py-2 text-right font-mono ${row.isTotal ? "text-emerald-400" : "text-slate-400"}`}>
                          {formatNumber(row.currentYear)}
                        </td>
                        <td className={`px-4 py-2 text-right font-mono ${row.isTotal ? "text-emerald-400" : "text-slate-400"}`}>
                          {formatNumber(row.projectedYear)}
                        </td>
                      </>
                    ) : (
                      <>
                        <td />
                        <td />
                        <td />
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Assets & Liabilities */}
        {assets.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-emerald-500 rounded-full" />
              Schedule of Assets
            </h2>
            <div className="overflow-x-auto rounded-lg border border-slate-700/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800/80 text-slate-400">
                    <th className="text-left px-4 py-3 font-medium">Particular</th>
                    <th className="text-right px-4 py-3 font-medium">Previous Year</th>
                    <th className="text-right px-4 py-3 font-medium">Current Year</th>
                    <th className="text-right px-4 py-3 font-medium">Projected Year</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a) => (
                    <tr key={a.id} className="border-t border-slate-800">
                      <td className="px-4 py-2 text-slate-200">{a.particular}</td>
                      <td className="px-4 py-2 text-right font-mono text-slate-400">{fmt(a.previousYear)}</td>
                      <td className="px-4 py-2 text-right font-mono text-slate-400">{fmt(a.currentYear)}</td>
                      <td className="px-4 py-2 text-right font-mono text-slate-400">{fmt(a.projectedYear)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-600 bg-slate-800/50 font-semibold">
                    <td className="px-4 py-3 text-white">Total Assets</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-400">{fmt(assetTotals.previousYear)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-400">{fmt(assetTotals.currentYear)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-400">{fmt(assetTotals.projectedYear)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}

        {liabilities.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-rose-500 rounded-full" />
              Schedule of Liabilities
            </h2>
            <div className="overflow-x-auto rounded-lg border border-slate-700/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800/80 text-slate-400">
                    <th className="text-left px-4 py-3 font-medium">Particular</th>
                    <th className="text-right px-4 py-3 font-medium">Previous Year</th>
                    <th className="text-right px-4 py-3 font-medium">Current Year</th>
                    <th className="text-right px-4 py-3 font-medium">Projected Year</th>
                  </tr>
                </thead>
                <tbody>
                  {liabilities.map((l) => (
                    <tr key={l.id} className="border-t border-slate-800">
                      <td className="px-4 py-2 text-slate-200">{l.particular}</td>
                      <td className="px-4 py-2 text-right font-mono text-slate-400">{fmt(l.previousYear)}</td>
                      <td className="px-4 py-2 text-right font-mono text-slate-400">{fmt(l.currentYear)}</td>
                      <td className="px-4 py-2 text-right font-mono text-slate-400">{fmt(l.projectedYear)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-600 bg-slate-800/50 font-semibold">
                    <td className="px-4 py-3 text-white">Total Liabilities</td>
                    <td className="px-4 py-3 text-right font-mono text-rose-400">{fmt(liabilityTotals.previousYear)}</td>
                    <td className="px-4 py-3 text-right font-mono text-rose-400">{fmt(liabilityTotals.currentYear)}</td>
                    <td className="px-4 py-3 text-right font-mono text-rose-400">{fmt(liabilityTotals.projectedYear)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}

        {/* Key Ratios */}
        <section className="print-break">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-amber-500 rounded-full" />
            Key Financial Ratios (Current Year)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Net Profit Margin", value: `${ratios.netProfitMargin}%`, color: "blue" },
              { label: "Debt-Equity Ratio", value: ratios.debtEquityRatio, color: "purple" },
              { label: "Current Ratio", value: ratios.currentRatio, color: "teal" },
              { label: "Return on Equity", value: `${ratios.returnOnEquity}%`, color: "emerald" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4 text-center"
              >
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{label}</p>
                <p className={`text-2xl font-bold text-${color}-400`}>{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Auditor Section */}
        {(settings.auditorName || settings.auditorFirm) && (
          <section className="border-t border-slate-700/50 pt-8 mt-10">
            <div className="flex justify-between items-end text-sm">
              <div>
                <p className="text-slate-500">Prepared for banking purposes</p>
                <p className="text-slate-400 mt-1">Date: {new Date().toLocaleDateString("en-IN")}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-medium">{settings.auditorName}</p>
                <p className="text-slate-500">{settings.auditorFirm}</p>
                <p className="text-xs text-slate-600 mt-1">Chartered Accountant</p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
