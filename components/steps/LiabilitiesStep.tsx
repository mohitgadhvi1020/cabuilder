"use client";

import { useCMAStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EditableTable } from "@/components/EditableTable";
import { Receipt } from "lucide-react";

const columns = [
  { key: "particular", label: "Particular", type: "text" as const, width: "35%" },
  { key: "previousYear", label: "Previous Year (₹)", type: "number" as const, width: "21%" },
  { key: "currentYear", label: "Current Year (₹)", type: "number" as const, width: "21%" },
  { key: "projectedYear", label: "Projected Year (₹)", type: "number" as const, width: "21%" },
];

export function LiabilitiesStep() {
  const liabilities = useCMAStore((s) => s.formData.liabilities);
  const addLiability = useCMAStore((s) => s.addLiability);
  const removeLiability = useCMAStore((s) => s.removeLiability);
  const updateLiability = useCMAStore((s) => s.updateLiability);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Liabilities</CardTitle>
            <CardDescription>
              Schedule of liabilities — term loans, creditors, and provisions
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <EditableTable
          columns={columns}
          data={liabilities}
          onUpdate={(id, field, value) =>
            updateLiability(id, field as keyof typeof liabilities[0], value)
          }
          onAdd={addLiability}
          onRemove={removeLiability}
          addLabel="Add Liability"
        />
      </CardContent>
    </Card>
  );
}
