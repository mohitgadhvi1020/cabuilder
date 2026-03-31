"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MultiStepForm } from "@/components/MultiStepForm";
import { useCMAStore, getDefaultFormSnapshot } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Sparkles, Loader2, Cloud } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { useAutoSave } from "@/lib/useAutoSave";
import { useToast } from "@/components/ui/toaster";
import type { FormData } from "@/lib/types";

function StepQuerySync() {
  const sp = useSearchParams();
  const setStep = useCMAStore((s) => s.setStep);
  useEffect(() => {
    const q = sp.get("step");
    if (q === null) return;
    const n = parseInt(q, 10);
    if (!Number.isNaN(n) && n >= 0 && n <= 10) setStep(n);
  }, [sp, setStep]);
  return null;
}

export default function ReportEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const loadFormData = useCMAStore((s) => s.loadFormData);
  const loadDummyData = useCMAStore((s) => s.loadDummyData);
  const resetForm = useCMAStore((s) => s.resetForm);
  const setReportContext = useCMAStore((s) => s.setReportContext);
  const companyName = useCMAStore((s) => s.formData.companyDetails.name);
  const [ready, setReady] = useState(false);
  const { toast } = useToast();

  useAutoSave();

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !isSupabaseConfigured()) {
      setReportContext(id, null);
      setReady(true);
      return;
    }
    supabase
      .from("reports")
      .select("form_data, company_id")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data?.form_data) {
          loadFormData(getDefaultFormSnapshot());
        } else {
          loadFormData(data.form_data as FormData);
        }
        setReportContext(id, (data?.company_id as string) ?? null);
        setReady(true);
      });
  }, [id, loadFormData, setReportContext]);

  const saveNow = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;
    const fd = useCMAStore.getState().formData;
    const { error } = await supabase
      .from("reports")
      .update({ form_data: fd as unknown as Record<string, unknown>, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast("Save failed: " + error.message, "error");
    } else {
      toast("Saved to cloud", "success");
    }
  }, [id, toast]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 glass border-b border-card-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <Link href={`/reports/${id}`}>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
                Hub
              </Button>
            </Link>
            <div className="h-5 w-px bg-card-border" />
            <div>
              <h1 className="text-sm font-semibold text-foreground">{companyName || "CMA Report"}</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Cloud className="w-3 h-3" />
                Auto-saving · {id.slice(0, 8)}…
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isSupabaseConfigured() && (
              <Button variant="outline" size="sm" onClick={saveNow}>
                Save now
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={loadDummyData}
              className="gap-1 text-muted-foreground hover:text-accent"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Demo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetForm();
                router.push("/cma/create");
              }}
              className="gap-1 text-muted-foreground hover:text-red-500"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset local
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Suspense fallback={null}>
          <StepQuerySync />
        </Suspense>
        <MultiStepForm previewPath={`/reports/${id}/preview`} />
      </main>
    </div>
  );
}
