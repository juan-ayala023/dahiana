import { differenceInCalendarDays, parseISO } from "date-fns";
import type { FrecuenciaPago } from "@/types/database";

export type GoalStage = 0 | 1 | 2 | 3 | 4;

/** Etapa de la flor: semilla 0% → brote 25% → tallo 50% → capullo 75% → flor 100%. */
export function goalStage(porcentaje: number): GoalStage {
  if (porcentaje >= 100) return 4;
  if (porcentaje >= 75) return 3;
  if (porcentaje >= 50) return 2;
  if (porcentaje >= 25) return 1;
  return 0;
}

export const STAGE_LABELS = ["Semilla", "Brote", "Tallo", "Capullo", "Flor abierta"] as const;

/** Cuántos períodos de pago quedan hasta la fecha objetivo (mínimo 1). */
export function periodsUntil(frecuencia: FrecuenciaPago, today: string, fechaObjetivo: string): number {
  const days = differenceInCalendarDays(parseISO(fechaObjetivo), parseISO(today));
  if (days <= 0) return 1;
  const periodDays = frecuencia === "quincenal" ? 15 : 30;
  return Math.max(1, Math.ceil(days / periodDays));
}

/** Redondea hacia arriba a miles: 33.334 → 34.000 */
const ceilToThousand = (n: number) => Math.ceil(n / 1000) * 1000;

/**
 * Cuánto ahorrar por período (quincena o mes) para llegar a tiempo.
 * null si la meta no tiene fecha o no está activa.
 */
export function suggestedContribution(
  goal: { monto_objetivo: number; monto_actual: number; fecha_objetivo: string | null; estado: string },
  frecuencia: FrecuenciaPago,
  today: string,
): number | null {
  if (goal.estado !== "activa" || !goal.fecha_objetivo) return null;
  const remaining = Math.max(0, goal.monto_objetivo - goal.monto_actual);
  if (remaining === 0) return 0;
  return ceilToThousand(remaining / periodsUntil(frecuencia, today, goal.fecha_objetivo));
}
