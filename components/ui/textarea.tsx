"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-accent disabled:cursor-not-allowed disabled:opacity-50 resize-none",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
