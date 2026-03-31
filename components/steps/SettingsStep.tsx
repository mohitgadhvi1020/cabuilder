"use client";

import { useCMAStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { IncomeTaxMode, MoneyFormat } from "@/lib/types";

export function SettingsStep() {
  const settings = useCMAStore((s) => s.formData.settings);
  const yearColumns = useCMAStore((s) => s.yearColumns);
  const setSettings = useCMAStore((s) => s.setSettings);
  const setYearHeading = useCMAStore((s) => s.setYearHeading);
  const setLoanReportConfig = useCMAStore((s) => s.setLoanReportConfig);

  const moneyTile = (key: MoneyFormat, title: string, sub: string) => {
    const active = settings.moneyFormat === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => setSettings({ moneyFormat: key })}
        className={cn(
          "rounded-xl border px-3 py-3 text-left text-sm transition-colors",
          active
            ? "border-accent bg-accent text-white"
            : "border-card-border bg-white text-muted-foreground hover:border-slate-400"
        )}
      >
        <span className="font-medium block">{title}</span>
        <span className={cn("text-xs", active ? "text-white/85" : "text-muted-foreground")}>{sub}</span>
      </button>
    );
  };

  const taxChip = (mode: IncomeTaxMode, label: string) => (
    <button
      key={mode}
      type="button"
      onClick={() => setSettings({ incomeTaxMode: mode })}
      className={cn(
        "px-3 py-1.5 rounded-lg text-sm border",
        settings.incomeTaxMode === mode
          ? "bg-accent border-accent text-white"
          : "bg-white border-card-border text-muted-foreground hover:border-slate-400"
      )}
    >
      {label}
    </button>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10 text-accent">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Report settings</CardTitle>
            <CardDescription>Display format, tax, and column headings (Finline-style)</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
          <Label className="mb-3 block">Select money format</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {moneyTile("lakhs", "Figures in Lakhs", "e.g. 25.50 L")}
            {moneyTile("no_decimals", "No decimals", "25,50,357")}
            {moneyTile("decimals", "With decimals", "25,50,357.00")}
            {moneyTile("crores", "Figures in Crores", "e.g. 0.26 Cr")}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Label>Fixed asset schedule</Label>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setSettings({ fixedAssetSchedule: false })}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm border",
                  !settings.fixedAssetSchedule
                    ? "bg-accent border-accent text-white"
                    : "bg-white border-card-border text-muted-foreground hover:border-slate-400"
                )}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => setSettings({ fixedAssetSchedule: true })}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm border",
                  settings.fixedAssetSchedule
                    ? "bg-accent border-accent text-white"
                    : "bg-white border-card-border text-muted-foreground hover:border-slate-400"
                )}
              >
                Yes
              </button>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm">
            Save
          </Button>
        </div>

        <div>
          <Label>Income tax</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {taxChip("no", "No")}
            {taxChip("default", "Default")}
            {taxChip("custom", "Custom")}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <Label htmlFor="reportTitle">Report title</Label>
            <Input
              id="reportTitle"
              value={settings.reportTitle}
              onChange={(e) => setSettings({ reportTitle: e.target.value })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="fyStart">Financial year start</Label>
            <Input
              id="fyStart"
              type="date"
              value={settings.financialYearStart}
              onChange={(e) => setSettings({ financialYearStart: e.target.value })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="fyEnd">Financial year end</Label>
            <Input
              id="fyEnd"
              type="date"
              value={settings.financialYearEnd}
              onChange={(e) => setSettings({ financialYearEnd: e.target.value })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="projYears">Projection years (syncs loan step)</Label>
            <Input
              id="projYears"
              type="number"
              min={1}
              max={10}
              value={settings.projectionYears}
              onChange={(e) => {
                const n = Math.min(10, Math.max(1, parseInt(e.target.value, 10) || 1));
                setSettings({ projectionYears: n });
                setLoanReportConfig({ projectionCount: n });
              }}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Currency</Label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings({ currency: e.target.value })}
              className="mt-1.5 flex h-10 w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm text-foreground"
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <Label htmlFor="auditorName">Auditor name</Label>
            <Input
              id="auditorName"
              value={settings.auditorName}
              onChange={(e) => setSettings({ auditorName: e.target.value })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="auditorFirm">Auditor firm</Label>
            <Input
              id="auditorFirm"
              value={settings.auditorFirm}
              onChange={(e) => setSettings({ auditorFirm: e.target.value })}
              className="mt-1.5"
            />
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Year headings ({yearColumns.length} columns)</Label>
          <div className="rounded-lg border border-card-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-muted-foreground">
                  <th className="text-left px-3 py-2">Year label</th>
                  <th className="text-left px-3 py-2 w-40">Type</th>
                </tr>
              </thead>
              <tbody>
                {settings.yearHeadings.map((row, i) => (
                  <tr key={i} className="border-t border-card-border">
                    <td className="px-2 py-1">
                      <Input
                        value={row.yearLabel}
                        onChange={(e) => setYearHeading(i, { yearLabel: e.target.value })}
                        className="h-9 bg-white border-card-border"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <select
                        value={row.type}
                        onChange={(e) =>
                          setYearHeading(i, { type: e.target.value as "actual" | "estimated" })
                        }
                        className="h-9 w-full rounded-md border border-card-border bg-white px-2 text-foreground"
                      >
                        <option value="actual">Actual</option>
                        <option value="estimated">Estimated</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Column IDs: {yearColumns.map((c) => c.id).join(", ")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
