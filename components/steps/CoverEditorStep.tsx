"use client";

import { useCMAStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Check } from "lucide-react";
import { cn } from "@/lib/cn";

const COVER_TEMPLATES = [
  { id: "/covers/cover-1.svg", label: "Geometric Navy" },
  { id: "/covers/cover-2.svg", label: "Minimal Sidebar" },
  { id: "/covers/cover-3.svg", label: "Corner Angles" },
  { id: "/covers/cover-4.svg", label: "Diagonal Sweep" },
  { id: "/covers/cover-5.svg", label: "Teal Accent" },
  { id: "/covers/cover-6.svg", label: "Soft Curves" },
];

export function CoverEditorStep() {
  const { companyDetails, coverSettings } = useCMAStore((s) => s.formData);
  const setCover = useCMAStore((s) => s.setCoverSettings);

  const template = coverSettings.coverTemplate || COVER_TEMPLATES[0].id;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10 text-accent">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Edit cover page</CardTitle>
            <CardDescription>
              Choose a template background, set the title, and preview your report cover
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Live preview */}
        <div
          className="relative rounded-xl overflow-hidden border border-card-border shadow-lg"
          style={{ aspectRatio: "210 / 297" }}
        >
          {/* Template background image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={template}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Text overlay */}
          <div className="absolute inset-0 flex flex-col justify-between p-8 md:p-12">
            <div
              className="font-bold leading-tight tracking-tight"
              style={{
                fontSize: Math.min(coverSettings.fontSize * 0.55, 56),
                fontWeight: coverSettings.fontWeight,
                color: coverSettings.fontColor,
              }}
            >
              {coverSettings.titleText}
            </div>
            <div className="space-y-1">
              <p
                className="font-semibold text-lg"
                style={{ color: coverSettings.fontColor }}
              >
                {companyDetails.name || "Company name"}
              </p>
              <p
                className="text-sm opacity-70 max-w-md"
                style={{ color: coverSettings.fontColor }}
              >
                {companyDetails.address || "Address line"}
              </p>
            </div>
          </div>
        </div>

        {/* Template selector */}
        <div>
          <Label className="mb-3 block">Choose cover template</Label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {COVER_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setCover({ coverTemplate: t.id })}
                className={cn(
                  "relative rounded-lg overflow-hidden border-2 transition-all aspect-[210/297] group",
                  template === t.id
                    ? "border-accent ring-2 ring-accent/30 shadow-md"
                    : "border-card-border hover:border-slate-400"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.id}
                  alt={t.label}
                  className="w-full h-full object-cover"
                />
                {template === t.id && (
                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                )}
                <p className="absolute bottom-0 inset-x-0 bg-white/90 text-[9px] text-center py-0.5 font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {t.label}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Text controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>Cover title text</Label>
            <Input
              className="mt-1"
              value={coverSettings.titleText}
              onChange={(e) => setCover({ titleText: e.target.value })}
            />
          </div>
          <div>
            <Label>Font size (px)</Label>
            <Input
              type="number"
              className="mt-1"
              value={coverSettings.fontSize}
              onChange={(e) => setCover({ fontSize: parseInt(e.target.value, 10) || 48 })}
            />
          </div>
          <div>
            <Label>Font weight</Label>
            <Input
              type="number"
              step={100}
              min={100}
              max={900}
              className="mt-1"
              value={coverSettings.fontWeight}
              onChange={(e) => setCover({ fontWeight: parseInt(e.target.value, 10) || 600 })}
            />
          </div>
          <div>
            <Label>Font color</Label>
            <Input
              type="color"
              className="mt-1 h-10 w-full"
              value={coverSettings.fontColor}
              onChange={(e) => setCover({ fontColor: e.target.value })}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">Cover choices are saved automatically with your report.</p>
      </CardContent>
    </Card>
  );
}
