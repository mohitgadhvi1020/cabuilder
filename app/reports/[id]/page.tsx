"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Building2,
  Landmark,
  Banknote,
  Settings,
  Briefcase,
  BarChart3,
  Wallet,
  Receipt,
  FileImage,
  FileText,
  Eye,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const TILES = [
  { step: 0, label: "Company Details", icon: Building2 },
  { step: 1, label: "Loan Details", icon: Landmark },
  { step: 2, label: "Working Capital", icon: Banknote },
  { step: 3, label: "Settings", icon: Settings },
  { step: 4, label: "Business Profile", icon: Briefcase },
  { step: 5, label: "Operating Statement", icon: BarChart3 },
  { step: 6, label: "Assets", icon: Wallet },
  { step: 7, label: "Liabilities", icon: Receipt },
  { step: 8, label: "Old Term Loan", icon: Landmark },
  { step: 9, label: "Images", icon: FileImage },
  { step: 10, label: "Edit Cover", icon: FileText },
];

export default function ReportHubPage() {
  const params = useParams();
  const id = params.id as string;
  const base = `/reports/${id}`;

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <Link href="/companies" className="text-xs text-accent hover:underline">
            ← Companies
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-2">Review &amp; Edit</h1>
          <p className="text-sm text-muted-foreground">Open any section of your CMA report</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href={`${base}/preview`}>
            <Button className="gap-2">
              <Eye className="w-4 h-4" />
              Preview Report
            </Button>
          </Link>
          <Link href={`${base}/preview`}>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Download (from preview)
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {TILES.map(({ step, label, icon: Icon }) => (
            <Link key={step} href={`${base}/edit?step=${step}`}>
              <Card className="border-card-border bg-white hover:border-accent/40 transition-colors h-full shadow-sm">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <Icon className="w-8 h-8 text-accent" />
                  <span className="text-sm font-medium text-foreground leading-tight">{label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
