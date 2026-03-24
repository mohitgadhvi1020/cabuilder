"use client";

import { useCMAStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";

export function CompanyDetailsStep() {
  const { companyDetails } = useCMAStore((s) => s.formData);
  const setCompanyDetails = useCMAStore((s) => s.setCompanyDetails);

  const fields = [
    { key: "name", label: "Company Name", placeholder: "e.g. Sharma Industries Pvt. Ltd." },
    { key: "address", label: "Registered Address", placeholder: "Full address with PIN" },
    { key: "constitution", label: "Constitution", placeholder: "e.g. Private Limited, Partnership" },
    { key: "establishmentYear", label: "Year of Establishment", placeholder: "e.g. 2008" },
    { key: "panNumber", label: "PAN Number", placeholder: "AADCS1234A" },
    { key: "gstNumber", label: "GST Number", placeholder: "27AADCS1234A1ZP" },
    { key: "industry", label: "Industry / Sector", placeholder: "e.g. Manufacturing - Auto Components" },
    { key: "bankName", label: "Bank Name", placeholder: "e.g. State Bank of India" },
    { key: "branch", label: "Branch", placeholder: "e.g. MIDC Pune Branch" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Company Details</CardTitle>
            <CardDescription>Basic information about the company</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {fields.map((field) => (
            <div key={field.key} className={field.key === "address" ? "md:col-span-2" : ""}>
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                value={companyDetails[field.key as keyof typeof companyDetails] || ""}
                onChange={(e) => setCompanyDetails({ [field.key]: e.target.value })}
                placeholder={field.placeholder}
                className="mt-1.5"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
