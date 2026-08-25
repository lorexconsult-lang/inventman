import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-ink text-canvas hover:bg-ink/90 focus-visible:outline-ink",
        variant === "secondary" && "border border-line bg-surface text-ink hover:bg-muted focus-visible:outline-ink",
        variant === "ghost" && "text-subtle hover:bg-muted hover:text-ink focus-visible:outline-ink",
        className
      )}
      {...props}
    />
  );
}
