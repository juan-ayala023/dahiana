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
