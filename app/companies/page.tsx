"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCMAStore, getDefaultFormSnapshot } from "@/lib/store";
import { useToast } from "@/components/ui/toaster";

type CompanyRow = { id: string; name: string; address: string; created_at: string };

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const resetForm = useCMAStore((s) => s.resetForm);
  const setReportContext = useCMAStore((s) => s.setReportContext);
  const { toast } = useToast();

  useEffect(() => {
    let alive = true;
    const supabase = createClient();
    const done = () => {
      if (alive) setLoading(false);
    };
    if (!supabase) {
      queueMicrotask(done);
      return () => {
        alive = false;
      };
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        done();
        return;
      }
      supabase
        .from("companies")
        .select("id, name, address, created_at")
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (alive) setCompanies((data as CompanyRow[]) || []);
          done();
        });
    });
    return () => {
      alive = false;
    };
  }, []);

  const createCompany = async () => {
    const supabase = createClient();
    if (!supabase) {
      router.push("/auth/login");
      return;
    }
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      router.push("/auth/login");
      return;
    }
    const { data, error } = await supabase
      .from("companies")
      .insert({ user_id: u.user.id, name: name || "New company", address })
      .select("id")
      .single();
    if (error || !data) {
      toast(error?.message || "Failed to create company", "error");
      return;
    }
    const form = getDefaultFormSnapshot();
    form.companyDetails.name = name || form.companyDetails.name;
    form.companyDetails.address = address;
    const { data: rep, error: re } = await supabase
      .from("reports")
      .insert({
        company_id: data.id,
        user_id: u.user.id,
        title: "CMA Report",
        form_data: form,
      })
      .select("id")
      .single();
    if (re || !rep) {
      toast(re?.message || "Failed to create report", "error");
      return;
    }
    setName("");
    setAddress("");
    toast("Company created! Opening report…");
    router.push(`/reports/${rep.id}/edit`);
  };

  const workLocal = () => {
    resetForm();
    setReportContext(null, null);
    router.push("/cma/create");
  };

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen px-4 py-12 max-w-lg mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Cloud companies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Supabase env vars are not set. Use local builder only, or add keys from{" "}
              <code className="text-xs">.env.example</code>.
            </p>
            <Button onClick={workLocal}>Open local CMA builder</Button>
            <Link href="/" className="block text-sm text-accent">
              Home
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-accent" />
            <h1 className="text-xl font-bold text-foreground">Companies</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/cma/create">
              <Button variant="outline" size="sm">
                Local builder
              </Button>
            </Link>
            <Link href="/account">
              <Button variant="ghost" size="sm">
                Account
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-foreground flex items-center gap-2">
              <Plus className="w-4 h-4" /> New company
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Company name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <Button onClick={createCompany}>Create &amp; open report</Button>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Your companies</h2>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : companies.length === 0 ? (
            <p className="text-muted-foreground text-sm">No companies yet.</p>
          ) : (
            <ul className="space-y-2">
              {companies.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/companies/${c.id}`}
                    className="block rounded-lg border border-card-border bg-white px-4 py-3 hover:border-slate-400 transition-colors shadow-sm"
                  >
                    <p className="font-medium text-foreground">{c.name || "Untitled"}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.address}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
