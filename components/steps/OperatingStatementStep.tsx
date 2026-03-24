"use client";

import { useCMAStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { OperatingStatementGrid } from "@/components/OperatingStatementGrid";
import { OperatingStatementRow } from "@/lib/types";
import { BarChart3 } from "lucide-react";
import { useMemo, useCallback } from "react";

export function OperatingStatementStep() {
  const rawRows = useCMAStore((s) => s.formData.operatingStatement);
  const setRow = useCMAStore((s) => s.setOperatingStatementRow);

  // Recalculate derived totals based on editable rows
  const rows = useMemo(() => {
    const r = rawRows.map((row) => ({ ...row }));
    const get = (id: string, field: "previousYear" | "currentYear" | "projectedYear") => {
      const row = r.find((x) => x.id === id);
      return row ? row[field] : 0;
    };
    const sum = (ids: string[], field: "previousYear" | "currentYear" | "projectedYear") =>
      ids.reduce((s, id) => s + get(id, field), 0);

    type YearField = "previousYear" | "currentYear" | "projectedYear";
    const fields: YearField[] = ["previousYear", "currentYear", "projectedYear"];

    const setVal = (id: string, field: YearField, value: number) => {
      const row = r.find((x) => x.id === id);
      if (row) row[field] = value;
    };

    // Net Sales = Gross Sales - Excise Duty
    fields.forEach((f) => {
      setVal("os-3", f, get("os-1", f) - get("os-2", f));
    });

    // Total Cost of Production = sum of os-5..os-9
    fields.forEach((f) => {
      setVal("os-10", f, sum(["os-5", "os-6", "os-7", "os-8", "os-9"], f));
    });

    // Gross Profit = Net Sales - Cost of Production
    fields.forEach((f) => {
      setVal("os-11", f, get("os-3", f) - get("os-10", f));
    });

    // Total Operating Expenses = sum of os-13..os-15
    fields.forEach((f) => {
      setVal("os-16", f, sum(["os-13", "os-14", "os-15"], f));
    });

    // Operating Profit = Gross Profit - Total Operating Expenses
    fields.forEach((f) => {
      setVal("os-17", f, get("os-11", f) - get("os-16", f));
    });

    // Net Profit Before Tax = Operating Profit + Other Income
    fields.forEach((f) => {
      setVal("os-19", f, get("os-17", f) + get("os-18", f));
    });

    // Net Profit After Tax = NPBT - Tax
    fields.forEach((f) => {
      setVal("os-21", f, get("os-19", f) - get("os-20", f));
    });

    return r;
  }, [rawRows]);

  const handleCellEdit = useCallback(
    (id: string, field: keyof OperatingStatementRow, value: number) => {
      setRow(id, field, value);
    },
    [setRow]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Operating Statement</CardTitle>
            <CardDescription>
              Revenue, cost of production, and profit figures. Totals are auto-calculated.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <OperatingStatementGrid rows={rows} onCellEdit={handleCellEdit} />
      </CardContent>
    </Card>
  );
}
