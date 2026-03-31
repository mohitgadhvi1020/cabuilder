"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User,
  Building2,
  Phone,
  Mail,
  Loader2,
  LogOut,
  ArrowLeft,
  Check,
} from "lucide-react";
import { useToast } from "@/components/ui/toaster";

interface Profile {
  full_name: string;
  organization: string;
  phone: string;
  role: string;
}

export default function AccountPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    organization: "",
    phone: "",
    role: "ca",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }

      setEmail(user.email || "");

      const { data } = await supabase
        .from("profiles")
        .select("full_name, organization, phone, role")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
      }

      setLoading(false);
    });
  }, [router]);

  const handleSave = async () => {
    setError(null);
    setSaved(false);
    const supabase = createClient();
    if (!supabase) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }

    setSaving(true);
    const { error: err } = await supabase.from("profiles").upsert({
      id: user.id,
      ...profile,
    });
    setSaving(false);

    if (err) {
      setError(err.message);
      toast(err.message, "error");
      return;
    }

    setSaved(true);
    toast("Profile updated successfully!");
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    toast("Signed out successfully.");
    router.push("/");
    router.refresh();
  };

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-foreground">Account unavailable</CardTitle>
            <CardDescription>
              Supabase env vars are not set.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline">Back home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(30,58,95,0.06),transparent_50%)]" />

      <div className="max-w-xl mx-auto relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/companies"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to companies
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your profile and preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-accent" />
              Profile Information
            </CardTitle>
            <CardDescription>
              This information appears on your reports and workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  value={profile.full_name}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, full_name: e.target.value }))
                  }
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, phone: e.target.value }))
                  }
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization" className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                Organization / Firm Name
              </Label>
              <Input
                id="organization"
                value={profile.organization}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, organization: e.target.value }))
                }
                placeholder="ABC & Associates"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                Email
              </Label>
              <Input value={email} disabled className="bg-slate-50" />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed here.
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : saved ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Saved
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
              {saved && (
                <span className="text-sm text-success">
                  Profile updated successfully!
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
