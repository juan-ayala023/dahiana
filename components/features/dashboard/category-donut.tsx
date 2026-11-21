"use client";

import { Cell, Pie, PieChart } from "recharts";
import { formatCOP } from "@/lib/finance/format";

export type DonutSlice = { id: string; nombre: string; emoji: string; color: string; total: number };

/** Dona de gastos del mes por categoría + leyenda con porcentajes. */
export function CategoryDonut({ slices }: { slices: DonutSlice[] }) {
  const total = slices.reduce((s, x) => s + x.total, 0);
  const top = slices.slice(0, 5);
  const rest = slices.slice(5).reduce((s, x) => s + x.total, 0);
  const legend = rest > 0 ? [...top, { id: "resto", nombre: "Lo demás", emoji: "✨", color: "#E0D4DA", total: rest }] : top;

  return (
    <section aria-labelledby="dona-titulo" className="rounded-4xl bg-surface p-5 shadow-soft">
      <h2 id="dona-titulo" className="font-display text-xl font-semibold">
        ¿En qué se te va la plata?
      </h2>
      <div className="mt-3 flex items-center gap-4">
        <div className="relative size-36 shrink-0" role="img" aria-label={`Gastos del mes: ${formatCOP(total)} en total`}>
          <PieChart width={144} height={144}>
            <Pie
              data={legend}
              dataKey="total"
              nameKey="nombre"
              innerRadius={46}
              outerRadius={70}
              paddingAngle={legend.length > 1 ? 3 : 0}
              cornerRadius={8}
              stroke="none"
              isAnimationActive
              animationDuration={900}
            >
              {legend.map((s) => (
                <Cell key={s.id} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[11px] font-semibold text-muted-foreground">Total</span>
            <span className="font-display text-sm font-semibold tabular">{formatCOP(total)}</span>
          </div>
        </div>
        <ul className="flex min-w-0 flex-1 flex-col gap-1.5">
          {legend.map((s) => (
            <li key={s.id} className="flex items-center gap-2 text-sm">
              <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
              <span className="min-w-0 flex-1 truncate">
                <span aria-hidden>{s.emoji} </span>
                {s.nombre}
              </span>
              <span className="font-bold tabular text-muted-foreground">{Math.round((s.total / total) * 100)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
