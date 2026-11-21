"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: React.ReactNode; activeClassName?: string };

type SegmentedProps<T extends string> = {
  id: string;
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  className?: string;
};

/** Control segmentado tipo píldora con indicador animado. */
export function Segmented<T extends string>({ id, label, value, options, onChange, className }: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("grid gap-1 rounded-full bg-primary-soft/50 p-1", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative flex h-11 items-center justify-center rounded-full px-3 text-sm font-bold transition-colors",
              active ? (opt.activeClassName ?? "text-primary-deep") : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active ? (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-full bg-surface shadow-soft"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            ) : null}
            <span className="relative flex items-center gap-1.5">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
