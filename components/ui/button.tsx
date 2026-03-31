"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          {
            "bg-accent text-accent-foreground shadow-sm hover:bg-accent-hover active:scale-[0.98]":
              variant === "default",
            "border border-card-border bg-white text-foreground hover:bg-slate-50 hover:border-slate-400":
              variant === "outline",
            "text-muted-foreground hover:bg-slate-100 hover:text-foreground":
              variant === "ghost",
            "bg-destructive text-white shadow-sm hover:bg-red-700":
              variant === "destructive",
          },
          {
            "h-10 px-5 py-2": size === "default",
            "h-8 px-3 text-xs": size === "sm",
            "h-12 px-8 text-base": size === "lg",
            "h-10 w-10 p-0": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
