"use client";

import { useMemo } from "react";
import { useCMAStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Banknote } from "lucide-react";

export function WorkingCapitalStep() {
  const wc = useCMAStore((s) => s.formData.workingCapital);
  const setWorkingCapital = useCMAStore((s) => s.setWorkingCapital);
  const addLine = useCMAStore((s) => s.addWorkingCapitalLine);
  const updateLine = useCMAStore((s) => s.updateWorkingCapitalLine);
  const removeLine = useCMAStore((s) => s.removeWorkingCapitalLine);

  const computedTotal = useMemo(() => {
    const extra = wc.extraLines.reduce((s, l) => s + l.amount, 0);
    return (
      wc.closingStock +
      wc.receivables +
      wc.exportReceivables +
      wc.sundryDebtors -
      wc.payables +
      extra
    );
  }, [wc]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10 text-accent">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Working capital (estimation)</CardTitle>
            <CardDescription>Current-year working capital inputs (Finline-style)</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(
            [
              ["closingStock", "Closing stock"],
              ["receivables", "Receivables"],
              ["exportReceivables", "Export receivables"],
              ["sundryDebtors", "Sundry debtors"],
              ["payables", "Payables"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <Label>{label}</Label>
              <Input
                type="number"
                className="mt-1 bg-white border-card-border"
                value={wc[key] || ""}
                onChange={(e) =>
                  setWorkingCapital({ [key]: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-card-border bg-slate-50 p-4">
          <p className="text-sm text-muted-foreground">Total working capital (derived)</p>
          <p className="text-xl font-semibold text-foreground">{computedTotal.toLocaleString("en-IN")}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => setWorkingCapital({ wcTotal: computedTotal })}
          >
            Apply as WC total
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>WC loan %</Label>
            <Input
              type="number"
              className="mt-1 bg-white border-card-border"
              value={wc.wcLoanPct || ""}
              onChange={(e) =>
                setWorkingCapital({ wcLoanPct: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div>
            <Label>Total WC (OD/CC) loan</Label>
            <Input
              type="number"
              className="mt-1 bg-white border-card-border"
              value={wc.totalWcLoan || ""}
              onChange={(e) =>
                setWorkingCapital({ totalWcLoan: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div>
            <Label>Own contribution</Label>
            <Input
              type="number"
              className="mt-1 bg-white border-card-border"
              value={wc.ownContribution || ""}
              onChange={(e) =>
                setWorkingCapital({ ownContribution: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div>
            <Label>Interest on WC loan (%)</Label>
            <Input
              type="number"
              className="mt-1 bg-white border-card-border"
              value={wc.interestPct || ""}
              onChange={(e) =>
                setWorkingCapital({ interestPct: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Loan starting from</Label>
            <Input
              className="mt-1 bg-white border-card-border"
              placeholder="e.g. April 2025"
              value={wc.loanStartMonth}
              onChange={(e) => setWorkingCapital({ loanStartMonth: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            New item +
          </Button>
          <div className="mt-3 space-y-2">
            {wc.extraLines.map((line) => (
              <div key={line.id} className="flex gap-2 items-center">
                <Input
                  className="flex-1 bg-white border-card-border"
                  value={line.label}
                  onChange={(e) => {
                    const next = wc.extraLines.map((l) =>
                      l.id === line.id ? { ...l, label: e.target.value } : l
                    );
                    setWorkingCapital({ extraLines: next });
                  }}
                />
                <Input
                  type="number"
                  className="w-32 bg-white border-card-border"
                  value={line.amount || ""}
                  onChange={(e) => updateLine(line.id, parseFloat(e.target.value) || 0)}
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(line.id)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
