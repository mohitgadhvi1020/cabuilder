"use client";

import { useEffect, useState } from "react";
import { ReportPreview } from "@/components/ReportPreview";
import { useCMAStore } from "@/lib/store";
import { Loader2 } from "lucide-react";

export default function PreviewPage() {
  const [hydrated, setHydrated] = useState(false);
  const companyName = useCMAStore((s) => s.formData.companyDetails.name);

  useEffect(() => {
    /**
     * Zustand persist rehydrates asynchronously. The onRehydrateStorage
     * callback fires when done but we may have already mounted.
     * Check if the store already has data by reading a sentinel field;
     * if not, wait a tick for the persist middleware to finish.
     */
    const check = () => {
      const state = useCMAStore.getState();
      if (state.formData.companyDetails.name || state.yearColumns.length > 0) {
        setHydrated(true);
        return true;
      }
      return false;
    };

    if (check()) return;

    const unsub = useCMAStore.subscribe(() => {
      if (check()) unsub();
    });

    const timer = setTimeout(() => {
      setHydrated(true);
      unsub();
    }, 1000);

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return <ReportPreview backHref="/cma/create" />;
}
