"use client";

import { useCMAStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EditableTable } from "@/components/EditableTable";
import { Wallet } from "lucide-react";

const columns = [
  { key: "particular", label: "Particular", type: "text" as const, width: "35%" },
  { key: "previousYear", label: "Previous Year (₹)", type: "number" as const, width: "21%" },
  { key: "currentYear", label: "Current Year (₹)", type: "number" as const, width: "21%" },
  { key: "projectedYear", label: "Projected Year (₹)", type: "number" as const, width: "21%" },
];

export function AssetsStep() {
  const assets = useCMAStore((s) => s.formData.assets);
  const addAsset = useCMAStore((s) => s.addAsset);
  const removeAsset = useCMAStore((s) => s.removeAsset);
  const updateAsset = useCMAStore((s) => s.updateAsset);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Assets</CardTitle>
            <CardDescription>
              Schedule of assets — fixed and current
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <EditableTable
          columns={columns}
          data={assets}
          onUpdate={(id, field, value) =>
            updateAsset(id, field as keyof typeof assets[0], value)
          }
          onAdd={addAsset}
          onRemove={removeAsset}
          addLabel="Add Asset"
        />
      </CardContent>
    </Card>
  );
}
