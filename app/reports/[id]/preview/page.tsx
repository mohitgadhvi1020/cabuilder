"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ReportPreview } from "@/components/ReportPreview";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useCMAStore, getDefaultFormSnapshot } from "@/lib/store";
import type { FormData } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function CloudPreviewPage() {
  const params = useParams();
  const id = params.id as string;
  const loadFormData = useCMAStore((s) => s.loadFormData);
  const setReportContext = useCMAStore((s) => s.setReportContext);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !isSupabaseConfigured()) {
      setReady(true);
      return;
    }
    supabase
      .from("reports")
      .select("form_data, company_id")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (!error && data?.form_data) {
          loadFormData(data.form_data as FormData);
        } else {
          loadFormData(getDefaultFormSnapshot());
        }
        setReportContext(id, (data?.company_id as string) ?? null);
        setReady(true);
      });
  }, [id, loadFormData, setReportContext]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return <ReportPreview backHref={`/reports/${id}/edit`} />;
}
