import type { ClasificacionGasto } from "@/types/database";

export type BudgetLevel = "ok" | "warn" | "over";

/** Umbral de la alerta suave. */
export const BUDGET_ALERT_PCT = 80;

/**
 * Estado de un límite: verde < 70%, durazno 70–100%, coral > 100%.
 */
export function budgetStatus(spent: number, limit: number): { pct: number; level: BudgetLevel; remaining: number } {
  const pct = limit > 0 ? (spent / limit) * 100 : 0;
  const level: BudgetLevel = pct > 100 ? "over" : pct >= 70 ? "warn" : "ok";
  return { pct, level, remaining: limit - spent };
}

export const RULE_SPLIT: Record<ClasificacionGasto, number> = { necesidad: 0.5, gusto: 0.3, ahorro: 0.2 };

export type RuleRow = { clase: ClasificacionGasto; target: number; actual: number; pct: number };

/**
 * Regla 50/30/20 sobre el ingreso del mes.
 * `actual.ahorro` debe incluir los abonos a metas del mes.
 */
export function rule503020(income: number, actual: Record<ClasificacionGasto, number>): RuleRow[] {
  return (Object.keys(RULE_SPLIT) as ClasificacionGasto[]).map((clase) => {
    const target = Math.round(income * RULE_SPLIT[clase]);
    return { clase, target, actual: actual[clase], pct: target > 0 ? (actual[clase] / target) * 100 : 0 };
  });
}

/** ¿Este gasto hizo cruzar el 80% o el 100% del límite? */
export function crossedThreshold(before: number, after: number, limit: number): 80 | 100 | null {
  if (limit <= 0) return null;
  const b = (before / limit) * 100;
  const a = (after / limit) * 100;
  if (b <= 100 && a > 100) return 100;
  if (b < BUDGET_ALERT_PCT && a >= BUDGET_ALERT_PCT) return 80;
  return null;
}
