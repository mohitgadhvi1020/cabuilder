"use client";

import { useCMAStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { Receipt } from "lucide-react";

export function LiabilitiesStep() {
  const liabilities = useCMAStore((s) => s.formData.liabilities);
  const yearColumns = useCMAStore((s) => s.yearColumns);
  const addLiability = useCMAStore((s) => s.addLiability);
  const removeLiability = useCMAStore((s) => s.removeLiability);
  const updateLiability = useCMAStore((s) => s.updateLiability);
  const updateLiabilityCell = useCMAStore((s) => s.updateLiabilityCell);
  const applyLiabilityBulkPercent = useCMAStore((s) => s.applyLiabilityBulkPercent);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10 text-accent">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Liabilities</CardTitle>
            <CardDescription>Multi-year liabilities and net worth lines</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScheduleGrid
          columns={yearColumns}
          rows={liabilities}
          onParticularChange={(id, v) => updateLiability(id, "particular", v)}
          onCellEdit={updateLiabilityCell}
          onBulkPercent={applyLiabilityBulkPercent}
          onAdd={addLiability}
          onRemove={removeLiability}
          addLabel="Add liability row"
        />
      </CardContent>
    </Card>
  );
}
