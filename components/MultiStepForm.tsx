"use client";

import { useCMAStore } from "@/lib/store";
import { StepNavigation } from "@/components/StepNavigation";
import { Button } from "@/components/ui/button";
import { CompanyDetailsStep } from "@/components/steps/CompanyDetailsStep";
import { LoanDetailsStep } from "@/components/steps/LoanDetailsStep";
import { SettingsStep } from "@/components/steps/SettingsStep";
import { BusinessProfileStep } from "@/components/steps/BusinessProfileStep";
import { OperatingStatementStep } from "@/components/steps/OperatingStatementStep";
import { AssetsStep } from "@/components/steps/AssetsStep";
import { LiabilitiesStep } from "@/components/steps/LiabilitiesStep";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

const STEPS = [
  CompanyDetailsStep,
  LoanDetailsStep,
  SettingsStep,
  BusinessProfileStep,
  OperatingStatementStep,
  AssetsStep,
  LiabilitiesStep,
];

export function MultiStepForm() {
  const currentStep = useCMAStore((s) => s.currentStep);
  const setStep = useCMAStore((s) => s.setStep);
  const router = useRouter();

  const StepComponent = STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === STEPS.length - 1;

  return (
    <div className="w-full max-w-5xl mx-auto">
      <StepNavigation currentStep={currentStep} onStepClick={setStep} />

      <div className="mt-6 animate-in fade-in duration-300">
        <StepComponent />
      </div>

      <div className="flex items-center justify-between mt-8 pb-8">
        <Button
          variant="outline"
          onClick={() => setStep(currentStep - 1)}
          disabled={isFirst}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="flex gap-3">
          {isLast ? (
            <Button
              onClick={() => router.push("/cma/preview")}
              className="gap-2"
              size="lg"
            >
              <Eye className="w-4 h-4" />
              Preview Report
            </Button>
          ) : (
            <Button
              onClick={() => setStep(currentStep + 1)}
              className="gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
