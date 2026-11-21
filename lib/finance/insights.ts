import { formatCOP } from "./format";
import type { Category, Transaction } from "@/types/database";

export type Insight = {
  id: string;
  emoji: string;
  text: string;
  tone: "good" | "warning" | "neutral";
};

/** Umbral del detector de gastos hormiga (COP). */
export const ANT_EXPENSE_LIMIT = 20_000;
const ANT_MIN_COUNT = 5;

function sumByCategory(list: Transaction[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of list) {
    if (t.tipo !== "gasto" || !t.category_id) continue;
    map.set(t.category_id, (map.get(t.category_id) ?? 0) + t.monto);
  }
  return map;
}

/**
 * Compara el mes en curso con el mismo tramo del mes anterior (días 1..hoy),
 * para que la comparación sea justa aunque el mes vaya por la mitad.
 */
export function monthComparisonInsights(
  currentMonthToDate: Transaction[],
  previousSameRange: Transaction[],
  categoryById: Map<string, Category>,
): Insight[] {
  const out: Insight[] = [];
  const cur = sumByCategory(currentMonthToDate);
  const prev = sumByCategory(previousSameRange);

  let best: { id: string; change: number; diff: number } | null = null;
  for (const [id, prevTotal] of prev) {
    if (prevTotal < 20_000) continue;
    const curTotal = cur.get(id) ?? 0;
    const change = (curTotal - prevTotal) / prevTotal;
    if (Math.abs(change) < 0.2) continue;
    const diff = Math.abs(curTotal - prevTotal);
    if (!best || diff > best.diff) best = { id, change, diff };
  }

  if (best) {
    const cat = categoryById.get(best.id);
    const pct = Math.round(Math.abs(best.change) * 100);
    const name = cat?.nombre.toLowerCase() ?? "una categoría";
    out.push(
      best.change < 0
        ? {
            id: `cmp-${best.id}`,
            emoji: cat?.emoji ?? "📉",
            text: `Este mes llevas ${pct}% menos en ${name} que el mes pasado. ¡Vas divina! ✨`,
            tone: "good",
          }
        : {
            id: `cmp-${best.id}`,
            emoji: cat?.emoji ?? "📈",
            text: `Este mes llevas ${pct}% más en ${name} que el mes pasado a esta altura 👀`,
            tone: "warning",
          },
    );
  }

  return out;
}

/** "Llevas 14 antojos este mes ☕ = $98.000" */
export function antExpenseInsights(monthExpenses: Transaction[], categoryById: Map<string, Category>): Insight[] {
  const groups = new Map<string, { count: number; total: number }>();
  for (const t of monthExpenses) {
    if (t.tipo !== "gasto" || t.monto >= ANT_EXPENSE_LIMIT || !t.category_id) continue;
    const g = groups.get(t.category_id) ?? { count: 0, total: 0 };
    g.count += 1;
    g.total += t.monto;
    groups.set(t.category_id, g);
  }

  return [...groups.entries()]
    .filter(([, g]) => g.count >= ANT_MIN_COUNT)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 2)
    .map(([id, g]) => {
      const cat = categoryById.get(id);
      return {
        id: `ant-${id}`,
        emoji: cat?.emoji ?? "🐜",
        text: `Llevas ${g.count} gasticos de ${cat?.nombre.toLowerCase() ?? "otros"} este mes = ${formatCOP(g.total)}. Los gastos hormiga suman 🐜`,
        tone: "warning" as const,
      };
    });
}
