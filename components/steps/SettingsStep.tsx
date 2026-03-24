"use client";

import { useCMAStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings2 } from "lucide-react";

export function SettingsStep() {
  const settings = useCMAStore((s) => s.formData.settings);
  const setSettings = useCMAStore((s) => s.setSettings);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Report Settings</CardTitle>
            <CardDescription>Configure report parameters and auditor details</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <Label htmlFor="reportTitle">Report Title</Label>
            <Input
              id="reportTitle"
              value={settings.reportTitle}
              onChange={(e) => setSettings({ reportTitle: e.target.value })}
              placeholder="CMA Data Report - FY 2024-25"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="fyStart">Financial Year Start</Label>
            <Input
              id="fyStart"
              type="date"
              value={settings.financialYearStart}
              onChange={(e) => setSettings({ financialYearStart: e.target.value })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="fyEnd">Financial Year End</Label>
            <Input
              id="fyEnd"
              type="date"
              value={settings.financialYearEnd}
              onChange={(e) => setSettings({ financialYearEnd: e.target.value })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="projYears">Projection Years</Label>
            <Input
              id="projYears"
              type="number"
              min={1}
              max={5}
              value={settings.projectionYears}
              onChange={(e) => setSettings({ projectionYears: parseInt(e.target.value) || 1 })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
              value={settings.currency}
              onChange={(e) => setSettings({ currency: e.target.value })}
              className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 mt-1.5"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
          <div>
            <Label htmlFor="auditorName">Auditor Name</Label>
            <Input
              id="auditorName"
              value={settings.auditorName}
              onChange={(e) => setSettings({ auditorName: e.target.value })}
              placeholder="CA Rajesh Mehta"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="auditorFirm">Auditor Firm</Label>
            <Input
              id="auditorFirm"
              value={settings.auditorFirm}
              onChange={(e) => setSettings({ auditorFirm: e.target.value })}
              placeholder="Mehta & Associates"
              className="mt-1.5"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
