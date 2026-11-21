"use client";

import { createContext, startTransition, useCallback, useContext, useMemo, useOptimistic, useState } from "react";
import { toast } from "sonner";
import { createTransaction, deleteTransaction, updateTransaction } from "@/lib/actions/transactions";
import { formatCOP } from "@/lib/finance/format";
import { applyPendingOps, type PendingOp } from "@/lib/finance/transactions";
import type { Category, TipoMovimiento, Transaction } from "@/types/database";
import { QuickAddSheet } from "./quick-add-sheet";

/** `session` cambia en cada apertura para reiniciar el formulario sin cortar la animación de salida. */
type SheetState = { open: boolean; tipo: TipoMovimiento; editing: Transaction | null; session: number };

type TransactionsContextValue = {
  categories: Category[];
  categoryById: Map<string, Category>;
  /** Aplica los cambios optimistas pendientes sobre una lista del servidor. */
  withPending: (list: Transaction[]) => Transaction[];
  openNew: (tipo?: TipoMovimiento) => void;
  openEdit: (tx: Transaction) => void;
  save: (tx: Transaction, mode: "create" | "update") => void;
  remove: (tx: Transaction) => void;
};

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

export function useTransactions(): TransactionsContextValue {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error("useTransactions debe usarse dentro de <TransactionsProvider>");
  return ctx;
}

export function TransactionsProvider({ categories, children }: { categories: Category[]; children: React.ReactNode }) {
  const [ops, addOp] = useOptimistic<PendingOp[], PendingOp>([], (state, op) => [...state, op]);
  const [sheet, setSheet] = useState<SheetState>({ open: false, tipo: "gasto", editing: null, session: 0 });

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const withPending = useCallback((list: Transaction[]) => applyPendingOps(list, ops), [ops]);

  const openNew = useCallback(
    (tipo: TipoMovimiento = "gasto") => setSheet((s) => ({ open: true, tipo, editing: null, session: s.session + 1 })),
    [],
  );
  const openEdit = useCallback(
    (tx: Transaction) => setSheet((s) => ({ open: true, tipo: tx.tipo, editing: tx, session: s.session + 1 })),
    [],
  );
  const close = useCallback(() => setSheet((s) => ({ ...s, open: false })), []);

  const save = useCallback(
    (tx: Transaction, mode: "create" | "update") => {
      const input = {
        id: tx.id,
        tipo: tx.tipo,
        monto: tx.monto,
        category_id: tx.category_id ?? "",
        nota: tx.nota,
        fecha: tx.fecha,
      };
      startTransition(async () => {
        addOp({ type: mode === "create" ? "add" : "update", tx });
        const res = mode === "create" ? await createTransaction(input) : await updateTransaction(input);
        if (!res.ok) toast.error(res.error);
        else if (res.alert) {
          const { level, emoji, categoria, restante } = res.alert;
          toast(
            level === 80
              ? `${emoji} Ojo: ya vas en más del 80% de ${categoria}`
              : `${emoji} Pasaste el límite de ${categoria} este mes`,
            {
              description:
                level === 80
                  ? `Te quedan ${formatCOP(Math.max(0, restante))} para lo que resta del mes 👀`
                  : "Tranqui, no pasa nada. Mira tu presupuesto y ajustamos 🫶",
              duration: 6000,
            },
          );
        }
      });
    },
    [addOp],
  );

  const remove = useCallback(
    (tx: Transaction) => {
      startTransition(async () => {
        addOp({ type: "delete", id: tx.id });
        const res = await deleteTransaction(tx.id);
        if (res.ok) toast(tx.tipo === "gasto" ? "Gasto eliminado 🧹" : "Ingreso eliminado 🧹");
        else toast.error(res.error);
      });
    },
    [addOp],
  );

  const value = useMemo(
    () => ({ categories, categoryById, withPending, openNew, openEdit, save, remove }),
    [categories, categoryById, withPending, openNew, openEdit, save, remove],
  );

  return (
    <TransactionsContext.Provider value={value}>
      {children}
      <QuickAddSheet
        key={sheet.session}
        open={sheet.open}
        initialTipo={sheet.tipo}
        editing={sheet.editing}
        onClose={close}
      />
    </TransactionsContext.Provider>
  );
}
