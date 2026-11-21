"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Segmented } from "@/components/ui/segmented";
import { currentMonthKey, dayLabel, monthBounds, monthLabel, shiftMonth } from "@/lib/finance/dates";
import { formatCOP, todayInBogota } from "@/lib/finance/format";
import { groupByDay, normalizeText, totals } from "@/lib/finance/transactions";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types/database";
import { TransactionRow } from "./transaction-row";
import { useTransactions } from "./transactions-provider";

type TipoFilter = "todos" | "gasto" | "ingreso";

export function MovementsView({ monthKey, transactions }: { monthKey: string; transactions: Transaction[] }) {
  const { categories, categoryById, withPending, openNew, openEdit, remove } = useTransactions();
  const [tipo, setTipo] = useState<TipoFilter>("todos");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Transaction | null>(null);

  const today = todayInBogota();
  const isCurrentMonth = monthKey === currentMonthKey(today);

  // Lo del servidor + cambios optimistas, limitado al mes que se está viendo.
  const monthList = useMemo(() => {
    const { start, end } = monthBounds(monthKey);
    return withPending(transactions).filter((t) => t.fecha >= start && t.fecha < end);
  }, [withPending, transactions, monthKey]);

  const filtered = useMemo(() => {
    const q = normalizeText(deferredQuery);
    return monthList.filter((t) => {
      if (tipo !== "todos" && t.tipo !== tipo) return false;
      if (categoryId && t.category_id !== categoryId) return false;
      if (!q) return true;
      const cat = t.category_id ? categoryById.get(t.category_id) : undefined;
      const haystack = normalizeText(`${t.nota ?? ""} ${cat?.nombre ?? ""} ${t.monto}`);
      return haystack.includes(q);
    });
  }, [monthList, tipo, categoryId, deferredQuery, categoryById]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);
  const sum = useMemo(() => totals(monthList), [monthList]);
  const usedCategories = useMemo(() => {
    const used = new Set(monthList.map((t) => t.category_id));
    return categories.filter((c) => used.has(c.id) && (tipo === "todos" || c.tipo === tipo));
  }, [categories, monthList, tipo]);

  const hasFilters = tipo !== "todos" || categoryId !== null || query !== "";

  return (
    <div className="flex flex-col gap-5">
      {/* Mes */}
      <div className="flex items-center justify-between">
        <Link
          href={`/movimientos?mes=${shiftMonth(monthKey, -1)}`}
          className="flex size-11 items-center justify-center rounded-full bg-surface shadow-soft active:scale-95"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <h1 className="font-display text-2xl font-semibold">{monthLabel(monthKey)}</h1>
        {isCurrentMonth ? (
          <span className="size-11" aria-hidden />
        ) : (
          <Link
            href={`/movimientos?mes=${shiftMonth(monthKey, 1)}`}
            className="flex size-11 items-center justify-center rounded-full bg-surface shadow-soft active:scale-95"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="size-5" aria-hidden />
          </Link>
        )}
      </div>

      {/* Totales del mes */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-income/25 p-4">
          <p className="text-sm font-semibold text-muted-foreground">Entró 🌱</p>
          <p className="mt-1 font-display text-xl font-semibold text-income-strong tabular">{formatCOP(sum.ingresos)}</p>
        </div>
        <div className="rounded-3xl bg-expense/25 p-4">
          <p className="text-sm font-semibold text-muted-foreground">Salió 🍂</p>
          <p className="mt-1 font-display text-xl font-semibold tabular">{formatCOP(sum.gastos)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-faint" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar movimientos"
            aria-label="Buscar movimientos"
            className="h-12 w-full rounded-full border border-border bg-surface pl-12 pr-12 text-base shadow-soft placeholder:text-faint focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground"
              aria-label="Limpiar búsqueda"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>

        <Segmented
          id="filtro-tipo"
          label="Filtrar por tipo"
          value={tipo}
          onChange={(v) => {
            setTipo(v);
            setCategoryId(null);
          }}
          options={[
            { value: "todos", label: "Todos" },
            { value: "gasto", label: "Gastos" },
            { value: "ingreso", label: "Ingresos" },
          ]}
        />

        {usedCategories.length > 1 ? (
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-none" role="group" aria-label="Filtrar por categoría">
            {usedCategories.map((c) => {
              const active = categoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategoryId(active ? null : c.id)}
                  className={cn(
                    "flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors",
                    active ? "bg-primary-strong text-white" : "bg-surface text-foreground shadow-soft",
                  )}
                >
                  <span aria-hidden>{c.emoji}</span>
                  {c.nombre}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Lista */}
      {groups.length === 0 ? (
        <EmptyState
          filtered={hasFilters && monthList.length > 0}
          isCurrentMonth={isCurrentMonth}
          onAdd={() => openNew()}
          onClear={() => {
            setTipo("todos");
            setCategoryId(null);
            setQuery("");
          }}
        />
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((g) => (
            <section key={g.fecha} aria-labelledby={`dia-${g.fecha}`}>
              <div className="mb-2 flex items-baseline justify-between px-1">
                <h2 id={`dia-${g.fecha}`} className="font-bold text-foreground">
                  {dayLabel(g.fecha, today)}
                </h2>
                <p className="text-sm text-muted-foreground tabular">
                  {g.gastos > 0 ? `−${formatCOP(g.gastos)}` : ""}
                  {g.gastos > 0 && g.ingresos > 0 ? " · " : ""}
                  {g.ingresos > 0 ? `+${formatCOP(g.ingresos)}` : ""}
                </p>
              </div>
              <ul className="flex flex-col gap-2">
                <AnimatePresence initial={false}>
                  {g.items.map((tx) => (
                    <TransactionRow
                      key={tx.id}
                      tx={tx}
                      category={tx.category_id ? categoryById.get(tx.category_id) : undefined}
                      isOpen={openRow === tx.id}
                      onOpenChange={(open) => setOpenRow(open ? tx.id : null)}
                      onEdit={() => openEdit(tx)}
                      onDelete={() => setToDelete(tx)}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          ))}
          <p className="text-center text-sm text-muted-foreground">
            Desliza un movimiento hacia la izquierda para editar o eliminar
          </p>
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title={toDelete?.tipo === "ingreso" ? "¿Eliminar este ingreso?" : "¿Eliminar este gasto?"}
        description={toDelete ? `${formatCOP(toDelete.monto)} · no se puede deshacer.` : undefined}
        confirmLabel="Sí, eliminar"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) remove(toDelete);
          setToDelete(null);
          setOpenRow(null);
        }}
      />
    </div>
  );
}

function EmptyState({
  filtered,
  isCurrentMonth,
  onAdd,
  onClear,
}: {
  filtered: boolean;
  isCurrentMonth: boolean;
  onAdd: () => void;
  onClear: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-3 rounded-4xl bg-surface px-6 py-10 text-center shadow-soft"
    >
      <motion.span
        className="text-6xl"
        animate={{ rotate: [0, -8, 8, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.5 }}
        aria-hidden
      >
        {filtered ? "🔍" : "🌱"}
      </motion.span>
      <p className="font-display text-xl font-semibold">
        {filtered ? "Nada por aquí con esos filtros" : isCurrentMonth ? "Tu jardín está esperando su primera semilla" : "Este mes quedó en blanco"}
      </p>
      <p className="text-muted-foreground">
        {filtered
          ? "Prueba con otra búsqueda o quita los filtros."
          : "Cada gasto que anotas te ayuda a entender a dónde se va tu plata ✨"}
      </p>
      {filtered ? (
        <Button variant="soft" onClick={onClear}>
          Quitar filtros
        </Button>
      ) : (
        <Button onClick={onAdd}>Registrar un movimiento</Button>
      )}
    </motion.div>
  );
}
