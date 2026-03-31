"use client";

import { useCMAStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EditableTable } from "@/components/EditableTable";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Landmark } from "lucide-react";
import { cn } from "@/lib/cn";

const facilityColumns = [
  { key: "facilityType", label: "Facility Type", type: "text" as const, width: "20%" },
  { key: "sanctionedLimit", label: "Sanctioned Limit (₹)", type: "number" as const, width: "18%" },
  { key: "outstanding", label: "Outstanding (₹)", type: "number" as const, width: "18%" },
  { key: "interestRate", label: "Rate (%)", type: "number" as const, width: "12%" },
  { key: "securityDetails", label: "Security Details", type: "text" as const, width: "32%" },
];

export function LoanDetailsStep() {
  const loanDetails = useCMAStore((s) => s.formData.loanDetails);
  const cfg = useCMAStore((s) => s.formData.loanReportConfig);
  const setCfg = useCMAStore((s) => s.setLoanReportConfig);
  const addLoanDetail = useCMAStore((s) => s.addLoanDetail);
  const removeLoanDetail = useCMAStore((s) => s.removeLoanDetail);
  const updateLoanDetail = useCMAStore((s) => s.updateLoanDetail);

  const chip = (active: boolean) =>
    cn(
      "px-3 py-1.5 rounded-lg text-sm border transition-colors",
      active
        ? "bg-accent border-accent text-white"
        : "bg-white border-card-border text-muted-foreground hover:border-slate-400"
    );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Loan setup</CardTitle>
              <CardDescription>Industry, audited periods, projections, and new facility type</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Type of industry</Label>
            <Input
              className="mt-1 bg-white border-card-border"
              value={cfg.industryType}
              onChange={(e) => setCfg({ industryType: e.target.value })}
              placeholder="e.g. Manufacturing"
            />
          </div>

          <div>
            <Label>Audited financial years</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {cfg.auditedYears.map((y, i) => (
                <div key={i} className="flex items-center gap-1">
                  <Input
                    className="w-36 h-9 bg-white border-card-border"
                    value={y}
                    onChange={(e) => {
                      const next = [...cfg.auditedYears];
                      next[i] = e.target.value;
                      setCfg({ auditedYears: next });
                    }}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCfg({ auditedYears: [...cfg.auditedYears, `Year ${cfg.auditedYears.length + 1}`] })}
              >
                + Add audited year
              </Button>
            </div>
          </div>

          <div>
            <Label>Projection years needed</Label>
            <Input
              type="number"
              min={1}
              max={10}
              className="mt-1 w-32 bg-white border-card-border"
              value={cfg.projectionCount}
              onChange={(e) =>
                setCfg({ projectionCount: Math.min(10, Math.max(1, parseInt(e.target.value, 10) || 1)) })
              }
            />
          </div>

          <div>
            <Label>Existing term loan?</Label>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                className={chip(cfg.hasExistingTermLoan)}
                onClick={() => setCfg({ hasExistingTermLoan: true })}
              >
                Yes
              </button>
              <button
                type="button"
                className={chip(!cfg.hasExistingTermLoan)}
                onClick={() => setCfg({ hasExistingTermLoan: false })}
              >
                No
              </button>
            </div>
          </div>

          <div>
            <Label>What type of loan needed?</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {(
                [
                  ["term", "Term Loan"],
                  ["wc", "Working Capital / OD / CC"],
                  ["both", "Both"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  className={chip(cfg.newLoanType === k)}
                  onClick={() => setCfg({ newLoanType: k })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Banking facilities (detail)</CardTitle>
          <CardDescription>Sanction limits and security — optional line items</CardDescription>
        </CardHeader>
        <CardContent>
          <EditableTable
            columns={facilityColumns}
            data={loanDetails}
            onUpdate={(id, field, value) =>
              updateLoanDetail(id, field as keyof (typeof loanDetails)[0], value)
            }
            onAdd={addLoanDetail}
            onRemove={removeLoanDetail}
            addLabel="Add facility"
          />
        </CardContent>
      </Card>
    </div>
  );
}
