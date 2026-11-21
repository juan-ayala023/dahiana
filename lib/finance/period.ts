import { addDays, addMonths, differenceInCalendarDays, endOfMonth, format, getDaysInMonth, parseISO } from "date-fns";
import type { FrecuenciaPago } from "@/types/database";

/**
 * Período financiero actual: de un día de pago al siguiente (quincenal o
 * mensual) o el mes calendario si los ingresos son variables.
 */
export type Period = {
  /** Primer día del período (YYYY-MM-DD). */
  start: string;
  /** Último día del período, inclusive. */
  end: string;
  /** Próximo día de pago, o null si es variable. */
  nextPay: string | null;
  /** Días que quedan contando hoy (≥ 1). */
  daysLeft: number;
  totalDays: number;
  kind: "quincena" | "mes";
};

const fmt = (d: Date) => format(d, "yyyy-MM-dd");

/** Día de pago dentro de un mes, ajustado si el mes es más corto (30 → 28 en febrero). */
function payDate(year: number, monthIndex: number, day: number): Date {
  const base = new Date(year, monthIndex, 1);
  return new Date(year, monthIndex, Math.min(day, getDaysInMonth(base)));
}

export function currentPeriod(frecuencia: FrecuenciaPago, diasPago: number[], today: string): Period {
  const t = parseISO(today);

  if (frecuencia === "variable" || diasPago.length === 0) {
    const start = new Date(t.getFullYear(), t.getMonth(), 1);
    const end = endOfMonth(t);
    return {
      start: fmt(start),
      end: fmt(end),
      nextPay: null,
      daysLeft: differenceInCalendarDays(end, t) + 1,
      totalDays: differenceInCalendarDays(end, start) + 1,
      kind: "mes",
    };
  }

  const days = [...new Set(diasPago)].sort((a, b) => a - b);
  const candidates: Date[] = [];
  for (const offset of [-1, 0, 1]) {
    const m = addMonths(new Date(t.getFullYear(), t.getMonth(), 1), offset);
    for (const d of days) candidates.push(payDate(m.getFullYear(), m.getMonth(), d));
  }
  candidates.sort((a, b) => a.getTime() - b.getTime());

  const start = [...candidates].reverse().find((d) => differenceInCalendarDays(d, t) <= 0) ?? candidates[0]!;
  const next = candidates.find((d) => differenceInCalendarDays(d, t) > 0) ?? addMonths(start, 1);

  return {
    start: fmt(start),
    end: fmt(addDays(next, -1)),
    nextPay: fmt(next),
    daysLeft: Math.max(1, differenceInCalendarDays(next, t)),
    totalDays: Math.max(1, differenceInCalendarDays(next, start)),
    kind: frecuencia === "quincenal" ? "quincena" : "mes",
  };
}

/**
 * Suma de gastos fijos activos que vencen entre hoy y el fin del período.
 * Los que vencieron antes de hoy se asumen pagados (y registrados como gasto).
 */
export function pendingFixedExpenses(
  recurring: { monto: number; dia_mes: number; activo: boolean }[],
  today: string,
  periodEnd: string,
): number {
  const from = parseISO(today);
  const to = parseISO(periodEnd);
  let total = 0;
  for (const r of recurring) {
    if (!r.activo) continue;
    for (let m = new Date(from.getFullYear(), from.getMonth(), 1); m <= to; m = addMonths(m, 1)) {
      const due = payDate(m.getFullYear(), m.getMonth(), r.dia_mes);
      if (due >= from && due <= to) total += r.monto;
    }
  }
  return total;
}

/** Ingreso esperado en un período a partir del estimado mensual. */
export function expectedIncomeForPeriod(ingresoMensual: number | null, kind: Period["kind"]): number {
  if (!ingresoMensual) return 0;
  return kind === "quincena" ? Math.round(ingresoMensual / 2) : ingresoMensual;
}
