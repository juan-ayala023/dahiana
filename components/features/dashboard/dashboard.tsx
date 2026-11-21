"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/components/features/transactions/transactions-provider";
import { tipOfTheDay } from "@/lib/content/tips";
import type { DashboardData } from "@/lib/data/queries";
import { dailyAllowance } from "@/lib/finance/daily";
import { dayLabel, monthBounds, shiftMonth } from "@/lib/finance/dates";
import { formatCOP } from "@/lib/finance/format";
import { goalStage, STAGE_LABELS, suggestedContribution } from "@/lib/finance/goals";
import { antExpenseInsights, monthComparisonInsights } from "@/lib/finance/insights";
import { currentPeriod, expectedIncomeForPeriod, pendingFixedExpenses } from "@/lib/finance/period";
import { totals } from "@/lib/finance/transactions";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";
import { CategoryDonut, type DonutSlice } from "./category-donut";
import { HeroAllowance } from "./hero-allowance";

const STAGE_EMOJI = ["🌰", "🌱", "🌿", "🌷", "🌸"] as const;

type DashboardProps = {
  profile: Pick<Profile, "nombre" | "avatar_emoji" | "frecuencia_pago" | "dias_pago" | "ingreso_estimado">;
  today: string;
  greeting: { text: string; emoji: string };
  data: DashboardData;
};

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.05 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
});

export function Dashboard({ profile, today, greeting, data }: DashboardProps) {
  const { categoryById, withPending, openNew, openEdit } = useTransactions();
  const transactions = useMemo(() => withPending(data.transactions), [withPending, data.transactions]);

  const monthKey = today.slice(0, 7);
  const month = monthBounds(monthKey);
  const prevMonth = monthBounds(shiftMonth(monthKey, -1));

  const calc = useMemo(() => {
    const period = currentPeriod(profile.frecuencia_pago, profile.dias_pago, today);
    const inPeriod = transactions.filter((t) => t.fecha >= period.start && t.fecha <= period.end);
    const periodTotals = totals(inPeriod);
    const expected = expectedIncomeForPeriod(profile.ingreso_estimado, period.kind);
    const ingresosEstimados = periodTotals.ingresos === 0 && expected > 0;
    const ingresos = ingresosEstimados ? expected : periodTotals.ingresos;

    const fijosPendientes = pendingFixedExpenses(data.recurring, today, period.end);
    const ahorroPlanificado = data.goals.reduce(
      (s, g) => s + (suggestedContribution(g, profile.frecuencia_pago, today) ?? 0),
      0,
    );
    const ahorradoPeriodo = data.contributions
      .filter((c) => c.fecha >= period.start && c.fecha <= period.end)
      .reduce((s, c) => s + c.monto, 0);

    const result = dailyAllowance({
      ingresos,
      gastado: periodTotals.gastos,
      fijosPendientes,
      ahorroPlanificado,
      ahorrado: ahorradoPeriodo,
      daysLeft: period.daysLeft,
    });

    // Mes calendario
    const monthTx = transactions.filter((t) => t.fecha >= month.start && t.fecha < month.end);
    const monthTotals = totals(monthTx);
    const ahorradoMes = data.contributions
      .filter((c) => c.fecha >= month.start && c.fecha < month.end)
      .reduce((s, c) => s + c.monto, 0);

    const byCat = new Map<string, number>();
    for (const t of monthTx) {
      if (t.tipo !== "gasto") continue;
      const key = t.category_id ?? "sin";
      byCat.set(key, (byCat.get(key) ?? 0) + t.monto);
    }
    const slices: DonutSlice[] = [...byCat.entries()]
      .map(([id, total]) => {
        const c = categoryById.get(id);
        return { id, total, nombre: c?.nombre ?? "Sin categoría", emoji: c?.emoji ?? "✨", color: c?.color ?? "#E0D4DA" };
      })
      .sort((a, b) => b.total - a.total);

    // Insights: mismo tramo del mes anterior (días 1..hoy)
    const dayOfMonth = today.slice(8, 10);
    const prevSameRangeEnd = `${prevMonth.start.slice(0, 8)}${dayOfMonth}`;
    const prevSameRange = transactions.filter((t) => t.fecha >= prevMonth.start && t.fecha <= prevSameRangeEnd);
    const insights = [
      ...antExpenseInsights(monthTx, categoryById),
      ...monthComparisonInsights(monthTx, prevSameRange, categoryById),
    ];

    return {
      period,
      result,
      breakdown: { ingresos, ingresosEstimados, gastado: periodTotals.gastos, fijosPendientes },
      monthTotals,
      ahorradoMes,
      slices,
      insights,
    };
  }, [transactions, profile, today, data.recurring, data.goals, data.contributions, month.start, month.end, prevMonth.start, categoryById]);

  const recent = transactions.slice(0, 5);
  const tip = tipOfTheDay(today);
  const mood =
    calc.monthTotals.ingresos > 0 && calc.monthTotals.gastos < calc.monthTotals.ingresos
      ? "Vas divina este mes ✨"
      : calc.monthTotals.gastos > 0
        ? "Cada registro te acerca a tus metas 🌷"
        : "Hoy es un buen día para florecer 🌱";

  return (
    <div className="flex flex-col gap-5">
      <motion.header {...fadeUp(0)} className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-2xl" aria-hidden>
          {profile.avatar_emoji}
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {greeting.text} {greeting.emoji}
          </p>
          <h1 className="truncate font-display text-2xl font-semibold">{profile.nombre}</h1>
        </div>
      </motion.header>
      <motion.p {...fadeUp(1)} className="-mt-2 text-muted-foreground">
        {mood}
      </motion.p>

      <motion.div {...fadeUp(2)}>
        <HeroAllowance result={calc.result} period={calc.period} breakdown={calc.breakdown} />
      </motion.div>

      {/* Resumen del mes */}
      <motion.section {...fadeUp(3)} aria-label="Resumen del mes" className="grid grid-cols-3 gap-2">
        <MiniStat label="Ingresos" emoji="🌱" value={calc.monthTotals.ingresos} className="bg-income/25" valueClass="text-income-strong" />
        <MiniStat label="Gastos" emoji="🍂" value={calc.monthTotals.gastos} className="bg-expense/25" />
        <MiniStat label="Ahorrado" emoji="🐷" value={calc.ahorradoMes} className="bg-lavender/35" />
      </motion.section>

      {/* Insights */}
      {calc.insights.length > 0 ? (
        <motion.section {...fadeUp(4)} aria-label="Lo que noté este mes" className="flex flex-col gap-2">
          {calc.insights.map((ins) => (
            <div
              key={ins.id}
              className={cn(
                "flex items-start gap-3 rounded-3xl p-4",
                ins.tone === "good" ? "bg-income/20" : ins.tone === "warning" ? "bg-peach/45" : "bg-surface shadow-soft",
              )}
            >
              <span className="text-2xl" aria-hidden>
                {ins.emoji}
              </span>
              <p className="text-sm font-medium">{ins.text}</p>
            </div>
          ))}
        </motion.section>
      ) : null}

      {/* Dona */}
      {calc.slices.length > 0 ? (
        <motion.div {...fadeUp(5)}>
          <CategoryDonut slices={calc.slices} />
        </motion.div>
      ) : null}

      {/* Últimos movimientos */}
      <motion.section {...fadeUp(6)} aria-labelledby="ultimos" className="rounded-4xl bg-surface p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 id="ultimos" className="font-display text-xl font-semibold">
            Últimos movimientos
          </h2>
          {recent.length > 0 ? (
            <Link href="/movimientos" className="flex min-h-11 items-center gap-0.5 text-sm font-bold text-primary-deep">
              Ver todos <ChevronRight className="size-4" aria-hidden />
            </Link>
          ) : null}
        </div>
        {recent.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <span className="text-5xl" aria-hidden>
              🌱
            </span>
            <p className="font-semibold">Aún no hay movimientos</p>
            <p className="text-sm text-muted-foreground">Anota tu primer gasto y empieza a ver tu jardín crecer</p>
            <Button size="sm" className="mt-2" onClick={() => openNew()}>
              Registrar mi primer gasto
            </Button>
          </div>
        ) : (
          <ul className="mt-2 flex flex-col">
            {recent.map((tx) => {
              const cat = tx.category_id ? categoryById.get(tx.category_id) : undefined;
              const isIncome = tx.tipo === "ingreso";
              return (
                <li key={tx.id}>
                  <button
                    type="button"
                    onClick={() => openEdit(tx)}
                    className="flex w-full items-center gap-3 rounded-2xl py-2.5 text-left active:bg-primary-soft/30"
                    aria-label={`${isIncome ? "Ingreso" : "Gasto"} de ${formatCOP(tx.monto)} en ${cat?.nombre ?? "sin categoría"}. Toca para editar`}
                  >
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-lg"
                      style={{ backgroundColor: `${cat?.color ?? "#E0D4DA"}55` }}
                      aria-hidden
                    >
                      {cat?.emoji ?? "✨"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{tx.nota || cat?.nombre || "Sin categoría"}</span>
                      <span className="block text-xs text-muted-foreground">{dayLabel(tx.fecha, today)}</span>
                    </span>
                    <span className={cn("font-display font-semibold tabular", isIncome && "text-income-strong")}>
                      {isIncome ? "+" : "−"}
                      {formatCOP(tx.monto)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </motion.section>

      {/* Mini jardín */}
      {data.goals.length > 0 ? (
        <motion.section {...fadeUp(7)} aria-labelledby="mini-jardin">
          <h2 id="mini-jardin" className="mb-3 font-display text-xl font-semibold">
            Mi jardín 🌷
          </h2>
          <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-none">
            {data.goals.map((g) => {
              const stage = goalStage(g.porcentaje);
              return (
                <div key={g.id} className="flex w-40 shrink-0 flex-col gap-2 rounded-4xl bg-surface p-4 shadow-soft">
                  <motion.span
                    className="text-4xl"
                    animate={{ rotate: [0, -6, 6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                    aria-hidden
                  >
                    {STAGE_EMOJI[stage]}
                  </motion.span>
                  <p className="truncate font-bold">
                    {g.emoji} {g.nombre}
                  </p>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-primary-soft"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(g.porcentaje)}
                    aria-label={`Avance de ${g.nombre}`}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: g.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(3, g.porcentaje)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {STAGE_LABELS[stage]} · {Math.round(g.porcentaje)}%
                  </p>
                  <p className="text-xs font-semibold tabular">
                    {formatCOP(g.monto_actual)} <span className="font-normal text-muted-foreground">de {formatCOP(g.monto_objetivo)}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </motion.section>
      ) : null}

      {/* Tip del día */}
      <motion.aside {...fadeUp(8)} aria-label="Tip del día" className="flex items-start gap-3 rounded-4xl bg-lavender/30 p-5">
        <span className="text-3xl" aria-hidden>
          {tip.emoji}
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary-deep">Tip del día</p>
          <p className="mt-1 font-medium">{tip.text}</p>
        </div>
      </motion.aside>
    </div>
  );
}

function MiniStat({
  label,
  emoji,
  value,
  className,
  valueClass,
}: {
  label: string;
  emoji: string;
  value: number;
  className?: string;
  valueClass?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col rounded-3xl p-3", className)}>
      <span className="text-xs font-semibold text-muted-foreground">
        {label} <span aria-hidden>{emoji}</span>
      </span>
      <AnimatedNumber value={value} className={cn("mt-1 truncate font-display text-[15px] font-semibold tabular", valueClass)} />
    </div>
  );
}
