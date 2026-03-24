"use client";

import { cn } from "@/lib/cn";
import { Check } from "lucide-react";

const STEPS = [
  { label: "Company", description: "Details" },
  { label: "Loans", description: "Facilities" },
  { label: "Settings", description: "Configure" },
  { label: "Business", description: "Profile" },
  { label: "Operating", description: "Statement" },
  { label: "Assets", description: "Schedule" },
  { label: "Liabilities", description: "Schedule" },
];

interface StepNavigationProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function StepNavigation({ currentStep, onStepClick }: StepNavigationProps) {
  return (
    <nav className="w-full mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isClickable = index <= currentStep;

          return (
            <div key={index} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => isClickable && onStepClick(index)}
                className={cn(
                  "flex flex-col items-center gap-1.5 group transition-all duration-300 cursor-pointer",
                  !isClickable && "cursor-not-allowed opacity-50"
                )}
                disabled={!isClickable}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 border-2",
                    isActive &&
                      "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30 scale-110",
                    isCompleted &&
                      "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20",
                    !isActive &&
                      !isCompleted &&
                      "bg-slate-800 border-slate-700 text-slate-500"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="text-center">
                  <p
                    className={cn(
                      "text-xs font-medium transition-colors",
                      isActive && "text-blue-400",
                      isCompleted && "text-emerald-400",
                      !isActive && !isCompleted && "text-slate-500"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-[10px] text-slate-600 hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </button>

              {index < STEPS.length - 1 && (
                <div className="flex-1 mx-2 mt-[-20px]">
                  <div
                    className={cn(
                      "h-0.5 rounded-full transition-all duration-500",
                      index < currentStep
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                        : index === currentStep
                        ? "bg-gradient-to-r from-blue-500/50 to-slate-700"
                        : "bg-slate-800"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
