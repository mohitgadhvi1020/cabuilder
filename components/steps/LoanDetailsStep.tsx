"use client";

import { useCMAStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EditableTable } from "@/components/EditableTable";
import { Landmark } from "lucide-react";

const columns = [
  { key: "facilityType", label: "Facility Type", type: "text" as const, width: "20%" },
  { key: "sanctionedLimit", label: "Sanctioned Limit (₹)", type: "number" as const, width: "18%" },
  { key: "outstanding", label: "Outstanding (₹)", type: "number" as const, width: "18%" },
  { key: "interestRate", label: "Rate (%)", type: "number" as const, width: "12%" },
  { key: "securityDetails", label: "Security Details", type: "text" as const, width: "32%" },
];

export function LoanDetailsStep() {
  const loanDetails = useCMAStore((s) => s.formData.loanDetails);
  const addLoanDetail = useCMAStore((s) => s.addLoanDetail);
  const removeLoanDetail = useCMAStore((s) => s.removeLoanDetail);
  const updateLoanDetail = useCMAStore((s) => s.updateLoanDetail);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Loan Details</CardTitle>
            <CardDescription>
              Existing and proposed banking facilities
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <EditableTable
          columns={columns}
          data={loanDetails}
          onUpdate={(id, field, value) =>
            updateLoanDetail(id, field as keyof typeof loanDetails[0], value)
          }
          onAdd={addLoanDetail}
          onRemove={removeLoanDetail}
          addLabel="Add Facility"
        />
      </CardContent>
    </Card>
  );
}
