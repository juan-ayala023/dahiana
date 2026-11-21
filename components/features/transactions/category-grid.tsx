"use client";

import { motion } from "framer-motion";
import { cn, haptic } from "@/lib/utils";
import type { Category } from "@/types/database";

type CategoryGridProps = {
  categories: Category[];
  value: string | null;
  onChange: (id: string) => void;
};

/** Grilla de categorías con emoji: se elige con un toque. */
export function CategoryGrid({ categories, value, onChange }: CategoryGridProps) {
  return (
    <div role="radiogroup" aria-label="Categoría" className="grid grid-cols-5 gap-x-1 gap-y-2">
      {categories.map((cat) => {
        const active = cat.id === value;
        return (
          <motion.button
            key={cat.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              haptic(5);
              onChange(cat.id);
            }}
            whileTap={{ scale: 0.9 }}
            className="flex min-h-11 flex-col items-center gap-1 rounded-2xl py-1"
          >
            <motion.span
              animate={active ? { scale: [1, 1.18, 1.06] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "flex size-12 items-center justify-center rounded-2xl text-2xl transition-shadow",
                active ? "shadow-[0_0_0_3px_var(--primary)]" : "",
              )}
              style={{ backgroundColor: `${cat.color}55` }}
              aria-hidden
            >
              {cat.emoji}
            </motion.span>
            <span
              className={cn(
                "w-full truncate text-center text-[11px] leading-tight",
                active ? "font-bold text-foreground" : "text-muted-foreground",
              )}
            >
              {cat.nombre}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
