import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, type = "text", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        "h-13 w-full rounded-2xl border border-border bg-white/80 px-4 text-base text-foreground shadow-[inset_0_1px_2px_rgba(74,53,64,0.04)] transition-[border-color,box-shadow,background-color]",
        "placeholder:text-faint",
        "focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/15",
        "disabled:cursor-not-allowed disabled:opacity-60",
        invalid && "border-danger/60 focus:border-danger focus:ring-danger/15",
        className,
      )}
      {...props}
    />
  );
});
