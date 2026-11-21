"use client";

import { animate, motion, useMotionValue, type PanInfo } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { formatCOP } from "@/lib/finance/format";
import { cn } from "@/lib/utils";
import type { Category, Transaction } from "@/types/database";

const ACTIONS_WIDTH = 152;

type TransactionRowProps = {
  tx: Transaction;
  category: Category | undefined;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
};

/** Fila deslizable: a la izquierda revela Editar / Eliminar. Tocarla abre la edición. */
export function TransactionRow({ tx, category, isOpen, onOpenChange, onEdit, onDelete }: TransactionRowProps) {
  const x = useMotionValue(0);

  useEffect(() => {
    const controls = animate(x, isOpen ? -ACTIONS_WIDTH : 0, { type: "spring", stiffness: 500, damping: 40 });
    return () => controls.stop();
  }, [isOpen, x]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const shouldOpen = info.offset.x < -50 || info.velocity.x < -400;
    const shouldClose = info.offset.x > 30 || info.velocity.x > 400;
    if (shouldOpen && !shouldClose) onOpenChange(true);
    else if (shouldClose) onOpenChange(false);
    else animate(x, isOpen ? -ACTIONS_WIDTH : 0, { type: "spring", stiffness: 500, damping: 40 });
  };

  const isIncome = tx.tipo === "ingreso";
  const label = `${isIncome ? "Ingreso" : "Gasto"} de ${formatCOP(tx.monto)} en ${category?.nombre ?? "sin categoría"}${tx.nota ? `, ${tx.nota}` : ""}`;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden rounded-3xl"
    >
      {/* Acciones detrás de la fila */}
      <div className="absolute inset-y-0 right-0 flex" style={{ width: ACTIONS_WIDTH }} aria-hidden={!isOpen}>
        <button
          type="button"
          tabIndex={isOpen ? 0 : -1}
          onClick={() => {
            onOpenChange(false);
            onEdit();
          }}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 bg-lavender/70 text-xs font-bold text-foreground"
        >
          <Pencil className="size-5" aria-hidden />
          Editar
        </button>
        <button
          type="button"
          tabIndex={isOpen ? 0 : -1}
          onClick={onDelete}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 bg-expense text-xs font-bold text-on-expense"
        >
          <Trash2 className="size-5" aria-hidden />
          Eliminar
        </button>
      </div>

      <motion.button
        type="button"
        style={{ x, touchAction: "pan-y" }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -ACTIONS_WIDTH, right: 0 }}
        dragElastic={0.08}
        onDragEnd={onDragEnd}
        onClick={() => (isOpen ? onOpenChange(false) : onEdit())}
        aria-label={`${label}. Toca para editar`}
        className="relative flex w-full items-center gap-3 bg-surface px-4 py-3 text-left"
      >
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-xl"
          style={{ backgroundColor: `${category?.color ?? "#E0D4DA"}55` }}
          aria-hidden
        >
          {category?.emoji ?? "✨"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-foreground">{category?.nombre ?? "Sin categoría"}</span>
          {tx.nota ? <span className="block truncate text-sm text-muted-foreground">{tx.nota}</span> : null}
        </span>
        <span className={cn("shrink-0 font-display font-semibold tabular", isIncome ? "text-income-strong" : "text-foreground")}>
          {isIncome ? "+" : "−"}
          {formatCOP(tx.monto)}
        </span>
      </motion.button>
    </motion.li>
  );
}
