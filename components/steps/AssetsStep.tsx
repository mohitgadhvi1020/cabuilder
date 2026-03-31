"use client";

import { useCMAStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { Wallet } from "lucide-react";

export function AssetsStep() {
  const assets = useCMAStore((s) => s.formData.assets);
  const yearColumns = useCMAStore((s) => s.yearColumns);
  const addAsset = useCMAStore((s) => s.addAsset);
  const removeAsset = useCMAStore((s) => s.removeAsset);
  const updateAsset = useCMAStore((s) => s.updateAsset);
  const updateAssetCell = useCMAStore((s) => s.updateAssetCell);
  const applyAssetBulkPercent = useCMAStore((s) => s.applyAssetBulkPercent);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10 text-accent">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Assets</CardTitle>
            <CardDescription>Multi-year asset schedule (linked to report columns)</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScheduleGrid
          columns={yearColumns}
          rows={assets}
          onParticularChange={(id, v) => updateAsset(id, "particular", v)}
          onCellEdit={updateAssetCell}
          onBulkPercent={applyAssetBulkPercent}
          onAdd={addAsset}
          onRemove={removeAsset}
          addLabel="Add asset row"
        />
      </CardContent>
    </Card>
  );
}
