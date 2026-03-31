"use client";

import { cn } from "@/lib/cn";
import { Check } from "lucide-react";

const STEPS = [
  { label: "Company", description: "Details" },
  { label: "Loans", description: "Setup" },
  { label: "WC", description: "Capital" },
  { label: "Settings", description: "Format" },
  { label: "Business", description: "Profile" },
  { label: "Operating", description: "P&L" },
  { label: "Assets", description: "Schedule" },
  { label: "Liabilities", description: "Schedule" },
  { label: "Old TL", description: "Existing" },
  { label: "Images", description: "Upload" },
  { label: "Cover", description: "Design" },
];

interface StepNavigationProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function StepNavigation({ currentStep, onStepClick }: StepNavigationProps) {
  return (
    <nav className="w-full mb-8 overflow-x-auto pb-2">
      <div className="flex items-start gap-1 min-w-max px-1">
        {STEPS.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isClickable = index <= currentStep;

          return (
            <div key={index} className="flex items-center">
              <button
                onClick={() => isClickable && onStepClick(index)}
                className={cn(
                  "flex flex-col items-center gap-1 group transition-all duration-300 px-1.5",
                  isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                )}
                disabled={!isClickable}
                type="button"
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all border-2 shrink-0",
                    isActive &&
                      "bg-accent border-accent text-accent-foreground shadow-md",
                    isCompleted && "bg-success border-success text-white",
                    !isActive && !isCompleted && "bg-white border-card-border text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <span>{index + 1}</span>}
                </div>
                <div className="text-center w-[4.5rem]">
                  <p
                    className={cn(
                      "text-[10px] font-medium leading-tight",
                      isActive && "text-accent",
                      isCompleted && "text-success",
                      !isActive && !isCompleted && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                </div>
              </button>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-4 h-0.5 shrink-0 rounded-full mt-[-18px]",
                    index < currentStep ? "bg-success" : "bg-card-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
