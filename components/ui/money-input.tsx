"use client";

import { forwardRef } from "react";
import { formatNumber } from "@/lib/finance/format";
import { cn, digitsToNumber } from "@/lib/utils";

type MoneyInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: number | null;
  onValueChange: (value: number | null) => void;
};

/** Input de pesos con formato en vivo ("1.250.000") y teclado numérico. */
export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { value, onValueChange, className, ...props },
  ref,
) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-display text-lg text-muted-foreground">
        $
      </span>
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value ? formatNumber(value) : ""}
        onChange={(e) => {
          const n = digitsToNumber(e.target.value);
          onValueChange(n > 0 ? n : null);
        }}
        className={cn(
          "h-13 w-full rounded-2xl border border-border bg-white/80 pl-9 pr-4 font-display text-lg text-foreground tabular placeholder:font-sans placeholder:text-base placeholder:text-faint focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/15",
          className,
        )}
        {...props}
      />
    </div>
  );
});
