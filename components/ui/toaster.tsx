"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
  exiting?: boolean;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <Toaster>");
  return ctx;
}

const ICON_MAP: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const STYLE_MAP: Record<ToastVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

const ICON_STYLE: Record<ToastVariant, string> = {
  success: "text-emerald-500",
  error: "text-red-500",
  info: "text-blue-500",
};

let nextId = 0;

function ToastItem({ toast: t, onRemove }: { toast: Toast; onRemove: (id: number) => void }) {
  const Icon = ICON_MAP[t.variant];

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-300",
        STYLE_MAP[t.variant],
        t.exiting
          ? "translate-x-full opacity-0"
          : "translate-x-0 opacity-100 animate-in"
      )}
    >
      <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", ICON_STYLE[t.variant])} />
      <p className="text-sm font-medium flex-1">{t.message}</p>
      <button
        onClick={() => onRemove(t.id)}
        className="shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function Toaster({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: number) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = ++nextId;
      setToasts((prev) => [...prev, { id, message, variant }]);
      const timer = setTimeout(() => {
        remove(id);
        timers.current.delete(id);
      }, 4000);
      timers.current.set(id, timer);
    },
    [remove]
  );

  useEffect(() => {
    const t = timers.current;
    return () => {
      t.forEach(clearTimeout);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
