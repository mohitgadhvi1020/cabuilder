"use client";

import { useCMAStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function CompanyDetailsStep() {
  const { companyDetails } = useCMAStore((s) => s.formData);
  const setCompanyDetails = useCMAStore((s) => s.setCompanyDetails);

  const fields = [
    { key: "name", label: "Company name", placeholder: "e.g. M/s Avadh Proteins" },
    { key: "address", label: "Address of the unit", placeholder: "Full address with PIN" },
    { key: "activity", label: "Your activity", placeholder: "e.g. Flour Mill, Dairy farm" },
    { key: "email", label: "Email", placeholder: "contact@company.com" },
    { key: "phone", label: "Phone number", placeholder: "10-digit mobile" },
    { key: "constitution", label: "Firm registration type", placeholder: "Proprietorship / Pvt Ltd" },
    { key: "establishmentYear", label: "Year of establishment", placeholder: "2008" },
    { key: "panNumber", label: "PAN", placeholder: "AADCS1234A" },
    { key: "gstNumber", label: "GST", placeholder: "27AAAAA0000A1Z5" },
    { key: "industry", label: "Industry / sector", placeholder: "Manufacturing" },
    { key: "bankName", label: "Bank name", placeholder: "SBI" },
    { key: "branch", label: "Branch", placeholder: "MIDC Branch" },
    { key: "ifscCode", label: "IFSC Code", placeholder: "SBIN0005943" },
  ] as const;

  const locChip = (active: boolean) =>
    cn(
      "px-3 py-2 rounded-lg text-sm border flex-1 sm:flex-none",
      active
        ? "bg-accent border-accent text-white"
        : "bg-white border-card-border text-muted-foreground hover:border-slate-400"
    );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10 text-accent">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Company details</CardTitle>
            <CardDescription>Basic information for the CMA cover and summary</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          <div>
            <Label>Your location</Label>
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <button
                type="button"
                className={locChip(companyDetails.locationType === "village")}
                onClick={() => setCompanyDetails({ locationType: "village" })}
              >
                Panchayath / Village
              </button>
              <button
                type="button"
                className={locChip(companyDetails.locationType === "town")}
                onClick={() => setCompanyDetails({ locationType: "town" })}
              >
                Town, Municipality, Corporation
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {fields.map((field) => (
              <div
                key={field.key}
                className={field.key === "address" || field.key === "activity" ? "md:col-span-2" : ""}
              >
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  value={String(companyDetails[field.key as keyof typeof companyDetails] ?? "")}
                  onChange={(e) => setCompanyDetails({ [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="mt-1.5"
                />
              </div>
            ))}
            <div>
              <Label htmlFor="employmentCount">Number of employment</Label>
              <Input
                id="employmentCount"
                type="number"
                min={0}
                value={companyDetails.employmentCount || ""}
                onChange={(e) =>
                  setCompanyDetails({ employmentCount: parseInt(e.target.value, 10) || 0 })
                }
                className="mt-1.5"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
