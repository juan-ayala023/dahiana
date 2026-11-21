import "server-only";
import { ACHIEVEMENT_CODES, type AchievementCode } from "@/lib/content/achievements";
import { LESSONS } from "@/lib/content/lessons";
import { monthBounds, shiftMonth } from "@/lib/finance/dates";
import { todayInBogota } from "@/lib/finance/format";
import { streakStats } from "@/lib/finance/streak";
import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

/**
 * Desbloquea logros (idempotente). Devuelve solo los que se desbloquearon
 * ahora, para poder celebrarlos en pantalla.
 */
export async function unlockAchievements(supabase: Client, codes: AchievementCode[]): Promise<AchievementCode[]> {
  if (codes.length === 0) return [];
  const { data, error } = await supabase
    .from("achievements")
    .upsert(
      codes.map((codigo) => ({ codigo })),
      { onConflict: "user_id,codigo", ignoreDuplicates: true },
    )
    .select("codigo");
  if (error) {
    console.error("[unlockAchievements]", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.codigo as AchievementCode);
}

/**
 * Revisa todas las condiciones de logros y desbloquea los que ya se cumplen
 * (por ejemplo, la racha de 7 días o un mes completo dentro del presupuesto).
 * Es idempotente: se puede llamar en cada visita.
 */
export async function syncAchievements(supabase: Client): Promise<AchievementCode[]> {
  const { data: owned } = await supabase.from("achievements").select("codigo");
  const have = new Set((owned ?? []).map((a) => a.codigo));
  const missing = ACHIEVEMENT_CODES.filter((c) => !have.has(c));
  if (missing.length === 0) return [];

  const today = todayInBogota();
  const prevMonth = monthBounds(shiftMonth(today.slice(0, 7), -1));

  const [dates, contributions, goals, lessons, prevBudgets, prevTx] = await Promise.all([
    supabase.from("transactions").select("fecha").order("fecha", { ascending: false }).limit(3000),
    supabase.from("goal_contributions").select("id", { count: "exact", head: true }),
    supabase.from("savings_goals_progress").select("estado, es_fondo_emergencia, porcentaje"),
    supabase.from("lesson_progress").select("lesson_slug"),
    supabase.from("budgets").select("category_id, limite").eq("mes", prevMonth.start),
    supabase
      .from("transactions")
      .select("category_id, monto")
      .eq("tipo", "gasto")
      .gte("fecha", prevMonth.start)
      .lt("fecha", prevMonth.end),
  ]);

  const fechas = (dates.data ?? []).map((d) => d.fecha);
  const { longest } = streakStats(fechas, today);
  const goalRows = goals.data ?? [];
  const lessonCount = new Set((lessons.data ?? []).map((l) => l.lesson_slug)).size;

  let respectedBudget = false;
  if ((prevBudgets.data ?? []).length > 0) {
    const spent = new Map<string, number>();
    for (const t of prevTx.data ?? []) {
      if (t.category_id) spent.set(t.category_id, (spent.get(t.category_id) ?? 0) + t.monto);
    }
    respectedBudget = (prevBudgets.data ?? []).every((b) => (spent.get(b.category_id) ?? 0) <= b.limite);
  }

  const conditions: Record<AchievementCode, boolean> = {
    primer_registro: fechas.length > 0,
    racha_7: longest >= 7,
    racha_30: longest >= 30,
    primer_abono: (contributions.count ?? 0) > 0,
    primera_meta: goalRows.some((g) => g.estado === "cumplida"),
    fondo_50: goalRows.some((g) => g.es_fondo_emergencia && Number(g.porcentaje) >= 50),
    mes_en_presupuesto: respectedBudget,
    primera_leccion: lessonCount > 0,
    escuelita_completa: lessonCount >= LESSONS.length,
  };

  return unlockAchievements(
    supabase,
    missing.filter((c) => conditions[c]),
  );
}
