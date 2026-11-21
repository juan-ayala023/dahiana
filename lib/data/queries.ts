import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { monthBounds } from "@/lib/finance/dates";
import { createClient } from "@/lib/supabase/server";
import type { Category, Profile, Tables, Transaction, Views } from "@/types/database";

/** Usuaria + perfil de la petición actual (memoizado por request). */
export const getSession = cache(async (): Promise<{ userId: string; profile: Profile | null }> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { userId: user.id, profile };
});

export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("tipo")
    .order("orden")
    .order("nombre");
  if (error) throw new Error(`No se pudieron cargar las categorías: ${error.message}`);
  return data;
});

export type DashboardData = {
  transactions: Transaction[];
  recurring: Tables<"recurring_expenses">[];
  goals: Views<"savings_goals_progress">[];
  contributions: Pick<Tables<"goal_contributions">, "monto" | "fecha">[];
};

/**
 * Todo lo que necesita el inicio, desde `from` (inicio del mes anterior o del
 * período, lo que sea antes) en adelante. Los cálculos se hacen en el cliente
 * con funciones puras para que reflejen al instante los registros optimistas.
 */
export async function getDashboardData(from: string): Promise<DashboardData> {
  const supabase = await createClient();
  const [tx, rec, goals, contrib] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .gte("fecha", from)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("recurring_expenses").select("*").eq("activo", true),
    supabase.from("savings_goals_progress").select("*").neq("estado", "pausada").order("created_at"),
    supabase.from("goal_contributions").select("monto, fecha").gte("fecha", from),
  ]);

  const failed = [tx, rec, goals, contrib].find((r) => r.error);
  if (failed?.error) throw new Error(`No se pudo cargar el inicio: ${failed.error.message}`);

  return {
    transactions: tx.data ?? [],
    recurring: rec.data ?? [],
    goals: (goals.data ?? []).map((g) => ({ ...g, porcentaje: Number(g.porcentaje) })),
    contributions: contrib.data ?? [],
  };
}

export type GoalProgress = Views<"savings_goals_progress">;

const normalizeGoal = (g: GoalProgress): GoalProgress => ({ ...g, porcentaje: Number(g.porcentaje) });

export async function getGarden(): Promise<{ goals: GoalProgress[]; fixedMonthly: number }> {
  const supabase = await createClient();
  const [goals, rec] = await Promise.all([
    supabase.from("savings_goals_progress").select("*").order("created_at"),
    supabase.from("recurring_expenses").select("monto").eq("activo", true),
  ]);
  if (goals.error) throw new Error(`No se pudo cargar el jardín: ${goals.error.message}`);
  return {
    goals: (goals.data ?? []).map(normalizeGoal),
    fixedMonthly: (rec.data ?? []).reduce((s, r) => s + r.monto, 0),
  };
}

export async function getGoalDetail(
  id: string,
): Promise<{ goal: GoalProgress; contributions: Tables<"goal_contributions">[] } | null> {
  const supabase = await createClient();
  const [goal, contributions] = await Promise.all([
    supabase.from("savings_goals_progress").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("goal_contributions")
      .select("*")
      .eq("goal_id", id)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);
  if (!goal.data) return null;
  return { goal: normalizeGoal(goal.data), contributions: contributions.data ?? [] };
}

export type BudgetData = {
  budgets: Tables<"budgets">[];
  previousBudgetsCount: number;
  transactions: Transaction[];
  ahorradoMes: number;
  recurring: Tables<"recurring_expenses">[];
};

export async function getBudgetData(monthKey: string, previousMonthKey: string): Promise<BudgetData> {
  const { start, end } = monthBounds(monthKey);
  const prevStart = monthBounds(previousMonthKey).start;
  const supabase = await createClient();

  const [budgets, prev, tx, contrib, rec] = await Promise.all([
    supabase.from("budgets").select("*").eq("mes", start),
    supabase.from("budgets").select("id", { count: "exact", head: true }).eq("mes", prevStart),
    supabase.from("transactions").select("*").gte("fecha", start).lt("fecha", end),
    supabase.from("goal_contributions").select("monto").gte("fecha", start).lt("fecha", end),
    supabase.from("recurring_expenses").select("*").order("dia_mes").order("nombre"),
  ]);

  const failed = [budgets, tx, rec].find((r) => r.error);
  if (failed?.error) throw new Error(`No se pudo cargar el presupuesto: ${failed.error.message}`);

  return {
    budgets: budgets.data ?? [],
    previousBudgetsCount: prev.count ?? 0,
    transactions: tx.data ?? [],
    ahorradoMes: (contrib.data ?? []).reduce((s, c) => s + c.monto, 0),
    recurring: rec.data ?? [],
  };
}

/** Lecciones completadas: slug → mejor puntaje del quiz. */
export async function getLessonProgress(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase.from("lesson_progress").select("lesson_slug, quiz_score");
  return Object.fromEntries((data ?? []).map((l) => [l.lesson_slug, l.quiz_score ?? 0]));
}

export async function getAchievementsData(): Promise<{
  unlocked: Record<string, string>;
  dates: string[];
}> {
  const supabase = await createClient();
  const [ach, tx] = await Promise.all([
    supabase.from("achievements").select("codigo, desbloqueado_at"),
    supabase.from("transactions").select("fecha").order("fecha", { ascending: false }).limit(3000),
  ]);
  return {
    unlocked: Object.fromEntries((ach.data ?? []).map((a) => [a.codigo, a.desbloqueado_at])),
    dates: [...new Set((tx.data ?? []).map((t) => t.fecha))],
  };
}

export async function getMonthTransactions(monthKey: string): Promise<Transaction[]> {
  const { start, end } = monthBounds(monthKey);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .gte("fecha", start)
    .lt("fecha", end)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`No se pudieron cargar los movimientos: ${error.message}`);
  return data;
}
