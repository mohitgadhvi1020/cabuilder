"use client";

import { Button } from "@/components/ui/button";
import { useCMAStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, Sparkles, RotateCcw, ArrowRight, Shield, Zap, Database } from "lucide-react";

export default function HomePage() {
  const loadDummyData = useCMAStore((s) => s.loadDummyData);
  const resetForm = useCMAStore((s) => s.resetForm);
  const router = useRouter();

  const handleStartFresh = () => {
    resetForm();
    router.push("/cma/create");
  };

  const handleLoadDemo = () => {
    loadDummyData();
    router.push("/cma/create");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-4 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.06),transparent_50%)]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 mb-8 glow">
            <FileSpreadsheet className="w-10 h-10 text-blue-400" />
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
            <span className="gradient-text">CMA Report</span>
            <br />
            <span className="text-white">Builder</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Build professional Credit Monitoring Arrangement reports in minutes.
            A guided 7-step wizard with auto-calculations and instant PDF export.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={handleStartFresh} className="min-w-[200px] gap-2 text-base">
              <ArrowRight className="w-5 h-5" />
              Start New Report
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleLoadDemo}
              className="min-w-[200px] gap-2 text-base"
            >
              <Sparkles className="w-5 h-5" />
              Load Demo Data
            </Button>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-12">
            {[
              { icon: Zap, label: "Auto-Calculations" },
              { icon: Database, label: "Local Storage" },
              { icon: Shield, label: "Privacy First" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/60 border border-slate-700/50 text-sm text-slate-400"
              >
                <Icon className="w-4 h-4 text-blue-400" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-600 border-t border-slate-800/50">
        CMA Report Builder • Frontend-Only • No data sent to servers
      </footer>
    </div>
  );
}
