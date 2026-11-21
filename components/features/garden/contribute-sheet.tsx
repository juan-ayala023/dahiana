"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Sheet } from "@/components/ui/sheet";
import { formatCOP, formatNumber } from "@/lib/finance/format";
import { cn } from "@/lib/utils";

type ContributeSheetProps = {
  open: boolean;
  onClose: () => void;
  goal: { nombre: string; emoji: string; restante: number };
  suggested: number | null;
  onSubmit: (monto: number, nota: string) => void;
};

export function ContributeSheet({ open, onClose, goal, suggested, onSubmit }: ContributeSheetProps) {
  const [monto, setMonto] = useState<number | null>(null);
  const [nota, setNota] = useState("");

  // Hasta 3 montos rápidos menores a lo que falta + "Todo" (lo que falta) siempre al final.
  const quick = [...new Set([suggested ?? 0, 20_000, 50_000, 100_000])]
    .filter((v) => v > 0 && v < goal.restante)
    .slice(0, 3);
  const chips = goal.restante > 0 ? [...quick, goal.restante] : quick;

  return (
    <Sheet open={open} onClose={onClose} label={`Abonar a ${goal.nombre}`}>
      <div className="flex flex-col gap-4 pb-2">
        <div>
          <h2 className="font-display text-2xl font-semibold">Regar tu flor 💧</h2>
          <p className="text-muted-foreground">
            {goal.emoji} {goal.nombre} · te faltan {formatCOP(goal.restante)}
          </p>
        </div>

        <MoneyInput
          value={monto}
          onValueChange={setMonto}
          placeholder="¿Cuánto vas a abonar?"
          aria-label="Monto del abono"
          className="h-16 text-center text-3xl"
          autoFocus
        />

        <div className="flex flex-wrap gap-2">
          {chips.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setMonto(v)}
              aria-pressed={monto === v}
              className={cn(
                "flex h-11 items-center rounded-full px-4 text-sm font-semibold tabular",
                monto === v ? "bg-primary-strong text-on-brand" : "bg-white/80 text-foreground shadow-soft",
              )}
            >
              {v === goal.restante ? "Todo · " : v === suggested ? "Sugerido · " : ""}${formatNumber(v)}
            </button>
          ))}
        </div>

        <Input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nota (opcional)" maxLength={200} aria-label="Nota del abono" />

        <Button size="lg" className="w-full" disabled={!monto} onClick={() => monto && onSubmit(monto, nota)}>
          Regar mi flor 💧
        </Button>
      </div>
    </Sheet>
  );
}
