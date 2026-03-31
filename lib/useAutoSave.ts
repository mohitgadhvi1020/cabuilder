"use client";

import { useEffect, useRef } from "react";
import { useCMAStore } from "./store";
import { createClient, isSupabaseConfigured } from "./supabase/client";

const DEBOUNCE_MS = 2000;

/**
 * Subscribes to Zustand formData changes and auto-saves to Supabase
 * whenever a reportId is set. Debounces writes by 2 seconds.
 */
export function useAutoSave() {
  const reportId = useCMAStore((s) => s.reportId);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    if (!reportId || !isSupabaseConfigured()) return;

    const unsub = useCMAStore.subscribe((state, prev) => {
      if (state.formData === prev.formData) return;
      if (!state.reportId) return;

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(async () => {
        if (savingRef.current) return;
        savingRef.current = true;
        try {
          const supabase = createClient();
          if (!supabase) return;
          const fd = useCMAStore.getState().formData;
          const rid = useCMAStore.getState().reportId;
          if (!rid) return;
          await supabase
            .from("reports")
            .update({ form_data: fd as unknown as Record<string, unknown>, updated_at: new Date().toISOString() })
            .eq("id", rid);
        } finally {
          savingRef.current = false;
        }
      }, DEBOUNCE_MS);
    });

    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [reportId]);
}
