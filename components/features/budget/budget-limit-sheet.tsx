"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/ui/money-input";
import { Sheet } from "@/components/ui/sheet";
import { setBudget } from "@/lib/actions/budget";
import { formatCOP, formatNumber } from "@/lib/finance/format";
import { cn, haptic } from "@/lib/utils";
import type { Category } from "@/types/database";

type Props = {
  open: boolean;
  onClose: () => void;
  category: Category;
  mes: string;
  current: number | null;
  spent: number;
};

const roundUp = (n: number, step: number) => Math.ceil(n / step) * step;

export function BudgetLimitSheet({ open, onClose, category, mes, current, spent }: Props) {
  const [limite, setLimite] = useState<number | null>(current);
  const [pending, startTransition] = useTransition();

  const suggestions = [...new Set([spent > 0 ? roundUp(spent * 1.1, 10_000) : 0, 100_000, 200_000, 300_000, 500_000])]
    .filter((v) => v > 0)
    .slice(0, 4);

  const save = (value: number | null) => {
    startTransition(async () => {
      const res = await setBudget({ category_id: category.id, mes, limite: value });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      haptic(10);
      toast.success(value ? `Límite de ${category.nombre}: ${formatCOP(value)} ✨` : `Quitaste el límite de ${category.nombre}`);
      onClose();
    });
  };

  return (
    <Sheet open={open} onClose={onClose} label={`Límite de ${category.nombre}`}>
      <div className="flex flex-col gap-4 pb-2">
        <div className="flex items-center gap-3">
          <span
            className="flex size-14 items-center justify-center rounded-2xl text-3xl"
            style={{ backgroundColor: `${category.color}55` }}
            aria-hidden
          >
            {category.emoji}
          </span>
          <div>
            <h2 className="font-display text-2xl font-semibold">{category.nombre}</h2>
            <p className="text-sm text-muted-foreground">Este mes llevas {formatCOP(spent)}</p>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">¿Cuánto quieres gastar máximo al mes?</span>
          <MoneyInput value={limite} onValueChange={setLimite} placeholder="Ej: 300.000" className="h-14 text-2xl" />
        </label>

        <div className="flex flex-wrap gap-2">
          {suggestions.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setLimite(v)}
              aria-pressed={limite === v}
              className={cn(
                "flex h-11 items-center rounded-full px-4 text-sm font-semibold tabular",
                limite === v ? "bg-primary-strong text-white" : "bg-white/80 shadow-soft",
              )}
            >
              ${formatNumber(v)}
            </button>
          ))}
        </div>

        <Button size="lg" className="w-full" disabled={!limite} loading={pending} onClick={() => save(limite)}>
          Guardar límite
        </Button>
        {current !== null ? (
          <Button variant="ghost" className="w-full" disabled={pending} onClick={() => save(null)}>
            Quitar límite
          </Button>
        ) : null}
      </div>
    </Sheet>
  );
}
