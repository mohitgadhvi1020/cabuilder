"use client";

import { MultiStepForm } from "@/components/MultiStepForm";
import { useCMAStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";

export default function CreatePage() {
  const loadDummyData = useCMAStore((s) => s.loadDummyData);
  const resetForm = useCMAStore((s) => s.resetForm);
  const companyName = useCMAStore((s) => s.formData.companyDetails.name);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Home
              </Button>
            </Link>
            <div className="h-5 w-px bg-card-border" />
            <div>
              <h1 className="text-sm font-semibold text-foreground">
                {companyName || "New CMA Report"}
              </h1>
              <p className="text-xs text-muted-foreground">CMA Report Builder</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadDummyData}
              className="gap-1 hover:text-accent"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Demo Data
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetForm}
              className="gap-1 hover:text-red-500"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <MultiStepForm />
      </main>
    </div>
  );
}
