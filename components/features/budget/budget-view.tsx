"use client";

import { startTransition, useMemo, useOptimistic, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/components/features/transactions/transactions-provider";
import { copyBudgets, markRecurringPaid, setCategoryClassification } from "@/lib/actions/budget";
import type { BudgetData } from "@/lib/data/queries";
import { budgetStatus, rule503020, type BudgetLevel } from "@/lib/finance/budget";
import { monthBounds, monthLabel, shiftMonth } from "@/lib/finance/dates";
import { formatCOP } from "@/lib/finance/format";
import { normalizeText, totals } from "@/lib/finance/transactions";
import { cn, haptic } from "@/lib/utils";
import type { Category, ClasificacionGasto, Tables } from "@/types/database";
import { BudgetLimitSheet } from "./budget-limit-sheet";
import { RecurringSheet } from "./recurring-sheet";

const CLASS_META: Record<ClasificacionGasto, { label: string; emoji: string; pct: number; examples: string; bg: string; bar: string }> = {
  necesidad: { label: "Necesidades", emoji: "🏠", pct: 50, examples: "Arriendo, mercado, transporte, salud, servicios", bg: "bg-lavender/30", bar: "#B9A3DD" },
  gusto: { label: "Gustos", emoji: "💅", pct: 30, examples: "Salidas, belleza, antojos, compras, planes", bg: "bg-primary-soft/60", bar: "#D97BA6" },
  ahorro: { label: "Ahorro", emoji: "🐷", pct: 20, examples: "Tus metas del jardín y el fondo de emergencia", bg: "bg-income/25", bar: "#5FBF94" },
};
const NEXT_CLASS: Record<ClasificacionGasto, ClasificacionGasto> = { necesidad: "gusto", gusto: "ahorro", ahorro: "necesidad" };
const LEVEL_COLOR: Record<BudgetLevel, string> = { ok: "#8FD5B6", warn: "#FFB98A", over: "#FF8A9B" };

type Props = {
  monthKey: string;
  isCurrentMonth: boolean;
  ingresoEstimado: number | null;
  data: BudgetData;
};

export function BudgetView({ monthKey, isCurrentMonth, ingresoEstimado, data }: Props) {
  const { categories, withPending } = useTransactions();
  const [showRule, setShowRule] = useState(false);
  const [limitFor, setLimitFor] = useState<{ category: Category; session: number } | null>(null);
  const [recurringSheet, setRecurringSheet] = useState<{ editing: Tables<"recurring_expenses"> | null; session: number } | null>(
    null,
  );
  const [classOverrides, overrideClass] = useOptimistic<Record<string, ClasificacionGasto>, [string, ClasificacionGasto]>(
    {},
    (s, [id, c]) => ({ ...s, [id]: c }),
  );

  const { start, end } = monthBounds(monthKey);
  const prevMonth = shiftMonth(monthKey, -1);
  const expenseCats = useMemo(
    () =>
      categories
        .filter((c) => c.tipo === "gasto")
        .map((c) => ({ ...c, clasificacion: classOverrides[c.id] ?? c.clasificacion })),
    [categories, classOverrides],
  );

  const monthTx = useMemo(
    () => withPending(data.transactions).filter((t) => t.fecha >= start && t.fecha < end),
    [withPending, data.transactions, start, end],
  );

  const calc = useMemo(() => {
    const spentByCat = new Map<string, number>();
    for (const t of monthTx) {
      if (t.tipo !== "gasto" || !t.category_id) continue;
      spentByCat.set(t.category_id, (spentByCat.get(t.category_id) ?? 0) + t.monto);
    }
    const byClass: Record<ClasificacionGasto, number> = { necesidad: 0, gusto: 0, ahorro: data.ahorradoMes };
    for (const c of expenseCats) {
      if (c.clasificacion) byClass[c.clasificacion] += spentByCat.get(c.id) ?? 0;
    }
    const { ingresos } = totals(monthTx);
    const base = ingresos > 0 ? ingresos : (ingresoEstimado ?? 0);
    return { spentByCat, rule: rule503020(base, byClass), base, baseEstimada: ingresos === 0 && base > 0 };
  }, [monthTx, expenseCats, data.ahorradoMes, ingresoEstimado]);

  const budgetByCat = useMemo(() => new Map(data.budgets.map((b) => [b.category_id, b.limite])), [data.budgets]);

  const rows = useMemo(() => {
    return expenseCats
      .map((c) => {
        const spent = calc.spentByCat.get(c.id) ?? 0;
        const limit = budgetByCat.get(c.id) ?? null;
        return { category: c, spent, limit, status: limit ? budgetStatus(spent, limit) : null };
      })
      .sort((a, b) => {
        if (a.status && b.status) return b.status.pct - a.status.pct;
        if (a.status) return -1;
        if (b.status) return 1;
        return b.spent - a.spent || a.category.orden - b.category.orden;
      });
  }, [expenseCats, calc.spentByCat, budgetByCat]);

  // Primero lo relevante (con límite o con gasto); el resto, detrás de "Ver todas".
  const [showAll, setShowAll] = useState(false);
  const relevant = rows.filter((r) => r.limit !== null || r.spent > 0);
  const minimum = relevant.length >= 3 ? relevant : rows.slice(0, 3);
  const visibleRows = showAll ? rows : minimum;
  const hiddenCount = rows.length - minimum.length;

  const totalLimits = data.budgets.reduce((s, b) => s + b.limite, 0);
  const totalSpentWithLimit = rows.reduce((s, r) => s + (r.limit ? r.spent : 0), 0);

  const cycleClass = (c: Category & { clasificacion: ClasificacionGasto | null }) => {
    const next = NEXT_CLASS[c.clasificacion ?? "gusto"];
    haptic(5);
    startTransition(async () => {
      overrideClass([c.id, next]);
      const res = await setCategoryClassification(c.id, next);
      if (res.ok) toast(`${c.emoji} ${c.nombre} ahora es ${next === "necesidad" ? "una necesidad" : next === "gusto" ? "un gusto" : "ahorro"}`);
      else toast.error(res.error);
    });
  };

  // Gastos fijos pagados este mes = existe un gasto con la misma nota.
  const paidNames = useMemo(
    () => new Set(monthTx.filter((t) => t.tipo === "gasto" && t.nota).map((t) => normalizeText(t.nota!))),
    [monthTx],
  );
  const activeRecurring = data.recurring.filter((r) => r.activo);
  const fixedTotal = activeRecurring.reduce((s, r) => s + r.monto, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Mes */}
      <div className="flex items-center justify-between">
        <Link
          href={`/presupuesto?mes=${prevMonth}`}
          className="flex size-11 items-center justify-center rounded-full bg-surface shadow-soft active:scale-95"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold">Presupuesto</h1>
          <p className="text-sm text-muted-foreground">{monthLabel(monthKey)}</p>
        </div>
        {isCurrentMonth ? (
          <span className="size-11" aria-hidden />
        ) : (
          <Link
            href={`/presupuesto?mes=${shiftMonth(monthKey, 1)}`}
            className="flex size-11 items-center justify-center rounded-full bg-surface shadow-soft active:scale-95"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="size-5" aria-hidden />
          </Link>
        )}
      </div>

      {/* Regla 50/30/20 */}
      <section aria-labelledby="regla" className="rounded-4xl bg-surface p-5 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="regla" className="font-display text-xl font-semibold">
              Tu 50/30/20
            </h2>
            <p className="text-sm text-muted-foreground">
              {calc.base > 0
                ? `Sobre ${formatCOP(calc.base)}${calc.baseEstimada ? " (tu ingreso estimado)" : " de ingresos este mes"}`
                : "Registra tus ingresos para ver tu reparto ideal"}
            </p>
          </div>
        </div>

        {/* Barra apilada ideal */}
        <div className="mt-4 flex h-4 overflow-hidden rounded-full" aria-hidden>
          {(Object.keys(CLASS_META) as ClasificacionGasto[]).map((k) => (
            <motion.div
              key={k}
              initial={{ width: 0 }}
              animate={{ width: `${CLASS_META[k].pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ backgroundColor: CLASS_META[k].bar }}
            />
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {calc.rule.map((r) => {
            const meta = CLASS_META[r.clase];
            const isSaving = r.clase === "ahorro";
            const over = !isSaving && r.pct > 100;
            return (
              <div key={r.clase} className={cn("rounded-3xl p-4", meta.bg)}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-bold">
                    <span aria-hidden>{meta.emoji}</span> {meta.label} <span className="font-normal text-muted-foreground">· {meta.pct}%</span>
                  </p>
                  <p className="text-sm font-semibold tabular">
                    {formatCOP(r.actual)}
                    {calc.base > 0 ? <span className="font-normal text-muted-foreground"> / {formatCOP(r.target)}</span> : null}
                  </p>
                </div>
                {calc.base > 0 ? (
                  <>
                    <div
                      className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/70"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(Math.min(100, r.pct))}
                      aria-label={`${meta.label}: ${Math.round(r.pct)}% de lo ideal`}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: over ? LEVEL_COLOR.over : meta.bar }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(2, r.pct))}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {isSaving
                        ? r.pct >= 100
                          ? "¡Meta de ahorro cumplida este mes! 🎉"
                          : `Te faltan ${formatCOP(Math.max(0, r.target - r.actual))} para tu 20% 🌱`
                        : over
                          ? `Vas ${formatCOP(r.actual - r.target)} por encima de lo ideal 🫶`
                          : `Te quedan ${formatCOP(r.target - r.actual)}`}
                    </p>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setShowRule((v) => !v)}
          aria-expanded={showRule}
          className="mt-3 flex min-h-11 items-center gap-1 text-sm font-bold text-primary-deep"
        >
          ¿Qué es el 50/30/20?
          <motion.span animate={{ rotate: showRule ? 180 : 0 }}>
            <ChevronDown className="size-4" aria-hidden />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {showRule ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-2 pt-1 text-sm">
                <p>Es una forma sencilla de repartir lo que te entra cada mes:</p>
                {(Object.keys(CLASS_META) as ClasificacionGasto[]).map((k) => (
                  <p key={k}>
                    <span aria-hidden>{CLASS_META[k].emoji}</span> <strong>{CLASS_META[k].pct}% {CLASS_META[k].label.toLowerCase()}:</strong>{" "}
                    {CLASS_META[k].examples}.
                  </p>
                ))}
                <p className="text-muted-foreground">
                  No es una ley: es una guía para saber si vas equilibrada. Toca la etiqueta de cada categoría abajo para decidir si
                  es necesidad, gusto o ahorro.
                </p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      {/* Límites por categoría */}
      <section aria-labelledby="limites">
        <div className="mb-3 flex items-end justify-between">
          <h2 id="limites" className="font-display text-xl font-semibold">
            Límites por categoría
          </h2>
          {totalLimits > 0 ? (
            <p className="text-xs text-muted-foreground tabular">
              {formatCOP(totalSpentWithLimit)} / {formatCOP(totalLimits)}
            </p>
          ) : null}
        </div>

        {data.budgets.length === 0 && data.previousBudgetsCount > 0 ? (
          <div className="mb-3 flex items-center gap-3 rounded-3xl bg-peach/40 p-4">
            <span className="text-2xl" aria-hidden>
              📋
            </span>
            <p className="flex-1 text-sm">¿Usamos los mismos límites del mes pasado?</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                startTransition(async () => {
                  const res = await copyBudgets(monthBounds(prevMonth).start, start);
                  if (res.ok) toast.success("Límites copiados ✨");
                  else toast.error(res.error);
                })
              }
            >
              Copiar
            </Button>
          </div>
        ) : data.budgets.length === 0 ? (
          <p className="mb-3 rounded-3xl bg-surface p-4 text-sm text-muted-foreground shadow-soft">
            Toca una categoría para ponerle un límite mensual. Te aviso con cariño cuando vayas en el 80% 💌
          </p>
        ) : null}

        <ul className="flex flex-col gap-2">
          {visibleRows.map(({ category: c, spent, limit, status }) => (
            <li key={c.id} className="rounded-3xl bg-surface shadow-soft">
              <div className="flex items-center gap-3 p-3 pb-2">
                <button
                  type="button"
                  onClick={() => setLimitFor((s) => ({ category: c, session: (s?.session ?? 0) + 1 }))}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  aria-label={`${c.nombre}: ${formatCOP(spent)} gastado${limit ? ` de ${formatCOP(limit)}` : ", sin límite"}. Toca para ${limit ? "cambiar" : "poner"} el límite`}
                >
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-xl"
                    style={{ backgroundColor: `${c.color}55` }}
                    aria-hidden
                  >
                    {c.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{c.nombre}</span>
                    <span className="block text-sm text-muted-foreground tabular">
                      {limit ? `${formatCOP(spent)} de ${formatCOP(limit)}` : spent > 0 ? `${formatCOP(spent)} · sin límite` : "Sin límite"}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => cycleClass(c)}
                  className="flex h-9 shrink-0 items-center rounded-full bg-background px-3 text-xs font-bold text-muted-foreground"
                  aria-label={`${c.nombre} es ${c.clasificacion ?? "gusto"}. Toca para cambiar`}
                >
                  {CLASS_META[c.clasificacion ?? "gusto"].emoji} {c.clasificacion === "necesidad" ? "Necesidad" : c.clasificacion === "ahorro" ? "Ahorro" : "Gusto"}
                </button>
              </div>
              {status && limit ? (
                <div className="px-3 pb-3">
                  <div
                    className="h-2.5 overflow-hidden rounded-full bg-primary-soft/50"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(Math.min(100, status.pct))}
                    aria-label={`${c.nombre}: ${Math.round(status.pct)}% del límite`}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: LEVEL_COLOR[status.level] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(2, status.pct))}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                    />
                  </div>
                  <p
                    className={cn(
                      "mt-1.5 text-xs font-semibold",
                      status.level === "over" ? "text-danger" : status.pct >= 80 ? "text-warn" : "text-muted-foreground",
                    )}
                  >
                    {status.level === "over"
                      ? `Te pasaste ${formatCOP(-status.remaining)} · mañana es otro día 🫶`
                      : status.pct >= 80
                        ? `Vas en el ${Math.round(status.pct)}% · te quedan ${formatCOP(status.remaining)} 👀`
                        : `Te quedan ${formatCOP(status.remaining)}`}
                  </p>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
        {hiddenCount > 0 ? (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            aria-expanded={showAll}
            className="mt-2 flex min-h-11 w-full items-center justify-center gap-1 rounded-3xl text-sm font-bold text-primary-deep"
          >
            {showAll ? "Ver menos" : `Ver todas las categorías (${hiddenCount} más)`}
            <motion.span animate={{ rotate: showAll ? 180 : 0 }}>
              <ChevronDown className="size-4" aria-hidden />
            </motion.span>
          </button>
        ) : null}
      </section>

      {/* Gastos fijos */}
      <section aria-labelledby="fijos">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 id="fijos" className="font-display text-xl font-semibold">
              Gastos fijos
            </h2>
            <p className="text-sm text-muted-foreground tabular">{formatCOP(fixedTotal)} al mes</p>
          </div>
          <Button
            size="icon"
            variant="soft"
            aria-label="Agregar gasto fijo"
            onClick={() => setRecurringSheet((s) => ({ editing: null, session: (s?.session ?? 0) + 1 }))}
          >
            <Plus aria-hidden />
          </Button>
        </div>

        {data.recurring.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-4xl bg-surface p-6 text-center shadow-soft">
            <span className="text-4xl" aria-hidden>
              🏠
            </span>
            <p className="font-semibold">Aún no tienes gastos fijos</p>
            <p className="text-sm text-muted-foreground">Arriendo, celular, gimnasio… lo que pagas cada mes sí o sí.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.recurring.map((r) => {
              const cat = r.category_id ? categories.find((c) => c.id === r.category_id) : undefined;
              const paid = paidNames.has(normalizeText(r.nombre));
              return (
                <li key={r.id} className={cn("flex items-center gap-3 rounded-3xl bg-surface p-3 shadow-soft", !r.activo && "opacity-60")}>
                  <button
                    type="button"
                    onClick={() => setRecurringSheet((s) => ({ editing: r, session: (s?.session ?? 0) + 1 }))}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    aria-label={`${r.nombre}, ${formatCOP(r.monto)} el día ${r.dia_mes}. Toca para editar`}
                  >
                    <span
                      className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-xl"
                      style={{ backgroundColor: `${cat?.color ?? "#E0D4DA"}55` }}
                      aria-hidden
                    >
                      {cat?.emoji ?? "✨"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{r.nombre}</span>
                      <span className="block text-sm text-muted-foreground tabular">
                        {formatCOP(r.monto)} · día {r.dia_mes}
                        {!r.activo ? " · inactivo" : ""}
                      </span>
                    </span>
                  </button>
                  {isCurrentMonth && r.activo ? (
                    paid ? (
                      <span className="flex h-9 shrink-0 items-center gap-1 rounded-full bg-income/30 px-3 text-xs font-bold text-income-strong">
                        <Check className="size-4" aria-hidden /> Pagado
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 shrink-0 px-3 text-xs"
                        onClick={() =>
                          startTransition(async () => {
                            const res = await markRecurringPaid(r.id);
                            if (res.ok) {
                              haptic(10);
                              toast.success(`${r.nombre} pagado y registrado ✅`);
                            } else toast.error(res.error);
                          })
                        }
                      >
                        Marcar pagado
                      </Button>
                    )
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {limitFor ? (
        <BudgetLimitSheet
          key={limitFor.session}
          open
          onClose={() => setLimitFor(null)}
          category={limitFor.category}
          mes={start}
          current={budgetByCat.get(limitFor.category.id) ?? null}
          spent={calc.spentByCat.get(limitFor.category.id) ?? 0}
        />
      ) : null}

      {recurringSheet ? (
        <RecurringSheet
          key={recurringSheet.session}
          open
          onClose={() => setRecurringSheet(null)}
          categories={expenseCats}
          editing={recurringSheet.editing}
        />
      ) : null}
    </div>
  );
}
