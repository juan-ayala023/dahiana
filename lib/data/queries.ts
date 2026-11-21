import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { monthBounds } from "@/lib/finance/dates";
import { createClient } from "@/lib/supabase/server";
import type { Category, Profile, Transaction } from "@/types/database";

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
