"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Check, NotebookPen, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { addDaysKey, shortDate } from "@/lib/finance/dates";
import { formatNumber, todayInBogota } from "@/lib/finance/format";
import { cn, haptic, uuid } from "@/lib/utils";
import type { TipoMovimiento, Transaction } from "@/types/database";
import { CategoryGrid } from "./category-grid";
import { applyKey, Keypad, type KeypadKey } from "./keypad";
import { useTransactions } from "./transactions-provider";

const SAVED_MESSAGES: Record<TipoMovimiento, string[]> = {
  gasto: ["¡Anotado! 💖", "Listo, quedó registrado ✨", "¡Bien hecho por llevar la cuenta! 🌸"],
  ingreso: ["¡Entró platica! 💸", "¡Qué bien! Ingreso anotado 🌷", "Tu jardín se pone feliz 🌱"],
};

type QuickAddSheetProps = {
  open: boolean;
  initialTipo: TipoMovimiento;
  editing: Transaction | null;
  onClose: () => void;
};

export function QuickAddSheet({ open, initialTipo, editing, onClose }: QuickAddSheetProps) {
  const { categories, save, remove } = useTransactions();
  const today = todayInBogota();

  const [tipo, setTipo] = useState<TipoMovimiento>(editing?.tipo ?? initialTipo);
  const [digits, setDigits] = useState(editing ? String(editing.monto) : "");
  const [categoryId, setCategoryId] = useState<string | null>(editing?.category_id ?? null);
  const [nota, setNota] = useState(editing?.nota ?? "");
  const [fecha, setFecha] = useState(editing?.fecha ?? today);
  const [showNote, setShowNote] = useState(Boolean(editing?.nota));
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const visibleCategories = useMemo(() => categories.filter((c) => c.tipo === tipo), [categories, tipo]);
  const monto = digits ? Number(digits) : 0;
  const canSave = monto > 0 && categoryId !== null && !saved;
  const yesterday = addDaysKey(today, -1);

  const changeTipo = (next: TipoMovimiento) => {
    setTipo(next);
    if (categoryId && !categories.some((c) => c.id === categoryId && c.tipo === next)) setCategoryId(null);
  };

  const onKey = useCallback((key: KeypadKey) => setDigits((d) => applyKey(d, key)), []);

  const submit = useCallback(() => {
    if (!canSave || !categoryId) return;
    const tx: Transaction = {
      id: editing?.id ?? uuid(),
      user_id: editing?.user_id ?? "",
      tipo,
      monto,
      category_id: categoryId,
      nota: nota.trim() || null,
      fecha,
      created_at: editing?.created_at ?? new Date().toISOString(),
    };
    save(tx, editing ? "update" : "create");
    haptic(10);
    setSaved(true);
    const messages = SAVED_MESSAGES[tipo];
    toast.success(editing ? "Cambios guardados ✨" : messages[Date.now() % messages.length]);
    setTimeout(onClose, 650);
  }, [canSave, categoryId, editing, tipo, monto, nota, fecha, save, onClose]);

  // Teclado físico (computador): números, borrar y Enter.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select")) return;
      if (/^\d$/.test(e.key)) onKey(e.key as KeypadKey);
      else if (e.key === "Backspace") onKey("back");
      else if (e.key === "Enter") submit();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onKey, submit]);

  const amountColor = tipo === "gasto" ? "text-foreground" : "text-income-strong";
  const sizeClass = digits.length > 9 ? "text-5xl" : "text-6xl";

  return (
    <Sheet open={open} onClose={onClose} label={editing ? "Editar movimiento" : "Registrar movimiento"}>
      <div className="relative flex flex-col gap-4">
        <div className="flex items-center gap-2">
          {editing ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-danger hover:bg-expense/20"
              aria-label="Eliminar movimiento"
            >
              <Trash2 className="size-5" aria-hidden />
            </button>
          ) : null}
          <Segmented
            id="tipo"
            label="Tipo de movimiento"
            value={tipo}
            onChange={changeTipo}
            className="flex-1"
            options={[
              { value: "gasto", label: "Gasto", activeClassName: "text-danger" },
              { value: "ingreso", label: "Ingreso", activeClassName: "text-income-strong" },
            ]}
          />
          <button
            type="button"
            onClick={onClose}
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-primary-soft/60"
            aria-label="Cerrar"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        {/* Monto */}
        <div className="flex min-h-20 items-center justify-center" aria-live="polite">
          <span className="sr-only">Monto: {monto > 0 ? `${formatNumber(monto)} pesos` : "cero"}</span>
          <div className={cn("flex items-baseline gap-1 font-display font-semibold tabular", amountColor)} aria-hidden>
            <span className="text-3xl text-muted-foreground">$</span>
            <motion.span
              key={digits.length}
              initial={{ scale: 0.94, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 600, damping: 28 }}
              className={cn(sizeClass, !digits && "text-faint")}
            >
              {monto > 0 ? formatNumber(monto) : "0"}
            </motion.span>
          </div>
        </div>

        <CategoryGrid categories={visibleCategories} value={categoryId} onChange={setCategoryId} />

        {/* Nota y fecha (opcionales) */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: today, label: "Hoy" },
            { key: yesterday, label: "Ayer" },
          ].map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setFecha(d.key)}
              aria-pressed={fecha === d.key}
              className={cn(
                "h-11 rounded-full px-4 text-sm font-semibold transition-colors",
                fecha === d.key ? "bg-primary-soft text-primary-deep" : "bg-white/70 text-muted-foreground",
              )}
            >
              {d.label}
            </button>
          ))}
          <label
            className={cn(
              "relative flex h-11 cursor-pointer items-center gap-1.5 rounded-full px-4 text-sm font-semibold",
              fecha !== today && fecha !== yesterday ? "bg-primary-soft text-primary-deep" : "bg-white/70 text-muted-foreground",
            )}
          >
            <CalendarDays className="size-4" aria-hidden />
            {fecha !== today && fecha !== yesterday ? shortDate(fecha) : "Otra"}
            <input
              type="date"
              value={fecha}
              max={today}
              onChange={(e) => e.target.value && setFecha(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Elegir otra fecha"
            />
          </label>
          <button
            type="button"
            onClick={() => setShowNote((v) => !v)}
            aria-expanded={showNote}
            className={cn(
              "ml-auto flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold",
              showNote || nota ? "bg-lavender/40 text-foreground" : "bg-white/70 text-muted-foreground",
            )}
          >
            <NotebookPen className="size-4" aria-hidden />
            Nota
          </button>
        </div>

        <AnimatePresence initial={false}>
          {showNote ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <input
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                maxLength={200}
                placeholder="Ej: almuerzo con las amigas 🥗"
                aria-label="Nota"
                className="h-12 w-full rounded-2xl border border-border bg-white/80 px-4 text-base placeholder:text-faint focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <Keypad onKey={onKey} />

        <Button size="lg" className="w-full" disabled={!canSave} onClick={submit}>
          {editing ? "Guardar cambios" : tipo === "gasto" ? "Guardar gasto" : "Guardar ingreso"}
        </Button>

        {/* Animación de guardado */}
        <AnimatePresence>
          {saved ? (
            <motion.div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-3xl bg-white/85 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              aria-hidden
            >
              <motion.div
                className="flex size-24 items-center justify-center rounded-full bg-brand shadow-glow"
                initial={{ scale: 0.3 }}
                animate={{ scale: [0.3, 1.15, 1] }}
                transition={{ duration: 0.45 }}
              >
                <Check className="size-12 text-white" strokeWidth={3} />
              </motion.div>
              <p className="font-display text-xl font-semibold">¡Listo!</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {editing ? (
        <ConfirmDialog
          open={confirmDelete}
          title={editing.tipo === "gasto" ? "¿Eliminar este gasto?" : "¿Eliminar este ingreso?"}
          description="No se puede deshacer."
          confirmLabel="Sí, eliminar"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            remove(editing);
            onClose();
          }}
        />
      ) : null}
    </Sheet>
  );
}
