"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, ArrowRight, UserPlus } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(30,58,95,0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(30,58,95,0.04),transparent_50%)]" />

        <div className="max-w-5xl w-full mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — text + CTA */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-accent/10 border border-accent/20 mb-6">
              <FileSpreadsheet className="w-7 h-7 text-accent" />
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              <span className="gradient-text">CMA Report</span>
              <br />
              <span className="text-foreground">Builder</span>
            </h1>

            <p className="text-muted-foreground max-w-md mx-auto lg:mx-0 mb-8 leading-relaxed">
              Professional Credit Monitoring Arrangement reports — built fast, exported clean.
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-3">
              <Link href="/auth/sign-up">
                <Button size="lg" className="min-w-[180px] gap-2 text-base">
                  <UserPlus className="w-5 h-5" />
                  Get Started
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="min-w-[180px] gap-2 text-base">
                  <ArrowRight className="w-5 h-5" />
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Right — hero image */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-[420px] aspect-[4/3] rounded-2xl border border-card-border bg-white p-4 shadow-sm overflow-hidden">
              <Image
                src="/home-hero-growth.png"
                alt="Growth chart and report illustration"
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 420px"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-card-border">
        CMA Report Builder
      </footer>
    </div>
  );
}
