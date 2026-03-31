"use client";

import { useCMAStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MultiYearGrid } from "@/components/MultiYearGrid";
import { deriveOperatingRows } from "@/lib/operatingDerived";
import { BarChart3 } from "lucide-react";
import { useMemo, useCallback } from "react";

export function OperatingStatementStep() {
  const rawRows = useCMAStore((s) => s.formData.operatingStatement);
  const yearColumns = useCMAStore((s) => s.yearColumns);
  const updateOperatingCell = useCMAStore((s) => s.updateOperatingCell);
  const applyOperatingBulkPercent = useCMAStore((s) => s.applyOperatingBulkPercent);
  const updateOperatingGrowthPct = useCMAStore((s) => s.updateOperatingGrowthPct);
  const setOperatingGrowthLock = useCMAStore((s) => s.setOperatingGrowthLock);

  const columnIds = useMemo(() => yearColumns.map((c) => c.id), [yearColumns]);

  const rows = useMemo(
    () => deriveOperatingRows(rawRows, columnIds),
    [rawRows, columnIds]
  );

  const handleCellEdit = useCallback(
    (id: string, columnId: string, value: number) => {
      updateOperatingCell(id, columnId, value);
    },
    [updateOperatingCell]
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
              Revenue, cost of production, and profit by year. Use the % column first: lock a row to fix
              YoY growth; amounts then cascade from the first year. Totals stay linked.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <MultiYearGrid
          columns={yearColumns}
          rows={rows}
          onCellEdit={handleCellEdit}
          onBulkPercent={applyOperatingBulkPercent}
          growthColumn
          onGrowthPctChange={updateOperatingGrowthPct}
          onGrowthLockToggle={setOperatingGrowthLock}
        />
      </CardContent>
    </Card>
  );
}
