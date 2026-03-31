"use client";

import { useCMAStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase } from "lucide-react";

export function BusinessProfileStep() {
  const profile = useCMAStore((s) => s.formData.businessProfile);
  const setBusinessProfile = useCMAStore((s) => s.setBusinessProfile);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10 text-accent">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Business Profile</CardTitle>
            <CardDescription>Describe the nature and operations of the business</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <Label htmlFor="richHtml">Business profile (rich text / HTML)</Label>
            <Textarea
              id="richHtml"
              value={profile.richHtml}
              onChange={(e) => setBusinessProfile({ richHtml: e.target.value })}
              placeholder="<p>Optional HTML for the narrative section in the printed report…</p>"
              className="mt-1.5 font-mono text-xs"
              rows={5}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="natureOfBusiness">Nature of Business</Label>
            <Textarea
              id="natureOfBusiness"
              value={profile.natureOfBusiness}
              onChange={(e) => setBusinessProfile({ natureOfBusiness: e.target.value })}
              placeholder="Describe the primary business activities..."
              className="mt-1.5"
              rows={3}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="productsServices">Products / Services</Label>
            <Textarea
              id="productsServices"
              value={profile.productsServices}
              onChange={(e) => setBusinessProfile({ productsServices: e.target.value })}
              placeholder="List key products or services..."
              className="mt-1.5"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="majorCustomers">Major Customers</Label>
            <Textarea
              id="majorCustomers"
              value={profile.majorCustomers}
              onChange={(e) => setBusinessProfile({ majorCustomers: e.target.value })}
              placeholder="List major customers..."
              className="mt-1.5"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="majorSuppliers">Major Suppliers</Label>
            <Textarea
              id="majorSuppliers"
              value={profile.majorSuppliers}
              onChange={(e) => setBusinessProfile({ majorSuppliers: e.target.value })}
              placeholder="List major suppliers..."
              className="mt-1.5"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="employeeCount">Number of Employees</Label>
            <Input
              id="employeeCount"
              type="number"
              value={profile.employeeCount || ""}
              onChange={(e) => setBusinessProfile({ employeeCount: parseInt(e.target.value) || 0 })}
              placeholder="250"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="experience">Industry Experience</Label>
            <Input
              id="experience"
              value={profile.experience}
              onChange={(e) => setBusinessProfile({ experience: e.target.value })}
              placeholder="e.g. 15+ years with ISO certifications"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="groupConcerns">Group Concerns</Label>
            <Input
              id="groupConcerns"
              value={profile.groupConcerns}
              onChange={(e) => setBusinessProfile({ groupConcerns: e.target.value })}
              placeholder="Sister concerns or group companies"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="associateCompanies">Associate Companies</Label>
            <Input
              id="associateCompanies"
              value={profile.associateCompanies}
              onChange={(e) => setBusinessProfile({ associateCompanies: e.target.value })}
              placeholder="Associated entities"
              className="mt-1.5"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
