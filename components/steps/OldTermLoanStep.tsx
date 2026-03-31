"use client";

import { useCMAStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Landmark } from "lucide-react";

export function OldTermLoanStep() {
  const loans = useCMAStore((s) => s.formData.oldTermLoans);
  const add = useCMAStore((s) => s.addOldTermLoan);
  const update = useCMAStore((s) => s.updateOldTermLoan);
  const remove = useCMAStore((s) => s.removeOldTermLoan);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10 text-accent">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Existing term loan</CardTitle>
            <CardDescription>Outstanding TL at audited year — feeds repayment schedule in report</CardDescription>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          + Add old termloan
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {loans.length === 0 && (
          <p className="text-sm text-muted-foreground">No old term loans added. Use the button above if applicable.</p>
        )}
        {loans.map((loan) => (
          <div
            key={loan.id}
            className="rounded-lg border border-card-border bg-slate-50 p-4 space-y-4 relative"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 text-muted-foreground hover:text-red-400"
              onClick={() => remove(loan.id)}
            >
              Remove
            </Button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Loan outstanding at audited year</Label>
                <Input
                  type="number"
                  className="mt-1 bg-white border-card-border"
                  value={loan.outstanding || ""}
                  onChange={(e) => update(loan.id, "outstanding", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Interest rate (%)</Label>
                <Input
                  type="number"
                  className="mt-1 bg-white border-card-border"
                  value={loan.interestRate || ""}
                  onChange={(e) => update(loan.id, "interestRate", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Monthly EMI</Label>
                <Input
                  type="number"
                  className="mt-1 bg-white border-card-border"
                  value={loan.monthlyEmi || ""}
                  onChange={(e) => update(loan.id, "monthlyEmi", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Years remaining</Label>
                <Input
                  type="number"
                  className="mt-1 bg-white border-card-border"
                  value={loan.yearsRemaining || ""}
                  onChange={(e) => update(loan.id, "yearsRemaining", parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
