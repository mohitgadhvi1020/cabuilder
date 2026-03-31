"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getDefaultFormSnapshot } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Plus } from "lucide-react";

type ReportRow = { id: string; title: string; status: string; updated_at: string };

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.from("companies").select("name").eq("id", companyId).single().then(({ data }) => {
      if (data?.name) setCompanyName(data.name);
    });
    supabase
      .from("reports")
      .select("id, title, status, updated_at")
      .eq("company_id", companyId)
      .order("updated_at", { ascending: false })
      .then(({ data }) => setReports((data as ReportRow[]) || []));
  }, [companyId]);

  const newReport = async () => {
    const supabase = createClient();
    if (!supabase) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      router.push("/auth/login");
      return;
    }
    const form = getDefaultFormSnapshot();
    const { data, error } = await supabase
      .from("reports")
      .insert({
        company_id: companyId,
        user_id: u.user.id,
        title: "CMA Report",
        form_data: form,
      })
      .select("id")
      .single();
    if (!error && data) router.push(`/reports/${data.id}/edit`);
  };

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/companies" className="text-xs text-accent hover:underline">
              ← Companies
            </Link>
            <h1 className="text-xl font-bold text-foreground mt-2">{companyName || "Company"}</h1>
          </div>
          <Button size="sm" onClick={newReport} className="gap-1">
            <Plus className="w-4 h-4" />
            New report
          </Button>
        </div>

        <div className="space-y-2">
          {reports.length === 0 ? (
            <p className="text-muted-foreground text-sm">No reports yet.</p>
          ) : (
            reports.map((r) => (
              <Link key={r.id} href={`/reports/${r.id}`}>
                <Card className="border-card-border bg-white hover:border-slate-400 transition-colors mb-2 shadow-sm">
                  <CardHeader className="py-3 flex flex-row items-center gap-2">
                    <FileText className="w-4 h-4 text-accent" />
                    <CardTitle className="text-base text-foreground">{r.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3 text-xs text-muted-foreground">
                    {r.status} · {new Date(r.updated_at).toLocaleString()}
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
