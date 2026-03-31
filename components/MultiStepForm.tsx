"use client";

import { useCMAStore } from "@/lib/store";
import { StepNavigation } from "@/components/StepNavigation";
import { Button } from "@/components/ui/button";
import { CompanyDetailsStep } from "@/components/steps/CompanyDetailsStep";
import { LoanDetailsStep } from "@/components/steps/LoanDetailsStep";
import { WorkingCapitalStep } from "@/components/steps/WorkingCapitalStep";
import { SettingsStep } from "@/components/steps/SettingsStep";
import { BusinessProfileStep } from "@/components/steps/BusinessProfileStep";
import { OperatingStatementStep } from "@/components/steps/OperatingStatementStep";
import { AssetsStep } from "@/components/steps/AssetsStep";
import { LiabilitiesStep } from "@/components/steps/LiabilitiesStep";
import { OldTermLoanStep } from "@/components/steps/OldTermLoanStep";
import { ImagesStep } from "@/components/steps/ImagesStep";
import { CoverEditorStep } from "@/components/steps/CoverEditorStep";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

const STEPS = [
  CompanyDetailsStep,
  LoanDetailsStep,
  WorkingCapitalStep,
  SettingsStep,
  BusinessProfileStep,
  OperatingStatementStep,
  AssetsStep,
  LiabilitiesStep,
  OldTermLoanStep,
  ImagesStep,
  CoverEditorStep,
];

interface MultiStepFormProps {
  previewPath?: string;
}

export function MultiStepForm({ previewPath = "/cma/preview" }: MultiStepFormProps) {
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
          type="button"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="flex gap-3">
          {isLast ? (
            <Button
              onClick={() => router.push(previewPath)}
              className="gap-2"
              size="lg"
              type="button"
            >
              <Eye className="w-4 h-4" />
              Preview Report
            </Button>
          ) : (
            <Button onClick={() => setStep(currentStep + 1)} className="gap-2" type="button">
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
