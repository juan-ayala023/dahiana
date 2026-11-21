"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { crossedThreshold } from "@/lib/finance/budget";
import { monthBounds } from "@/lib/finance/dates";
import { createClient } from "@/lib/supabase/server";
import {
  transactionSchema,
  type ActionResult,
  type BudgetAlert,
  type TransactionInput,
  type TransactionResult,
} from "@/lib/validations/transaction";
import { syncAchievements } from "./achievements";

const GENERIC_ERROR = "No pudimos guardar. Revisa tu conexión e intenta de nuevo 🌧️";

type Client = Awaited<ReturnType<typeof createClient>>;

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? GENERIC_ERROR;
}

/**
 * Si el gasto hizo cruzar el 80% o el 100% del límite de su categoría en ese
 * mes, devuelve un aviso amable para mostrar en pantalla.
 */
async function budgetAlertFor(
  supabase: Client,
  tx: { tipo: string; category_id: string; fecha: string; monto: number },
  previousMonto = 0,
): Promise<BudgetAlert | undefined> {
  if (tx.tipo !== "gasto") return undefined;
  const { start, end } = monthBounds(tx.fecha.slice(0, 7));

  const [{ data: budget }, { data: spentRows }, { data: cat }] = await Promise.all([
    supabase.from("budgets").select("limite").eq("category_id", tx.category_id).eq("mes", start).maybeSingle(),
    supabase
      .from("transactions")
      .select("monto")
      .eq("category_id", tx.category_id)
      .eq("tipo", "gasto")
      .gte("fecha", start)
      .lt("fecha", end),
    supabase.from("categories").select("nombre, emoji").eq("id", tx.category_id).maybeSingle(),
  ]);
  if (!budget) return undefined;

  const after = (spentRows ?? []).reduce((s, r) => s + r.monto, 0);
  const before = after - tx.monto + previousMonto;
  const level = crossedThreshold(before, after, budget.limite);
  if (!level) return undefined;
  return { level, categoria: cat?.nombre ?? "esta categoría", emoji: cat?.emoji ?? "✨", restante: budget.limite - after };
}

export async function createTransaction(input: TransactionInput): Promise<TransactionResult> {
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("transactions").insert(parsed.data);
  if (error) {
    console.error("[createTransaction]", error.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  const [alert, unlocked] = await Promise.all([budgetAlertFor(supabase, parsed.data), syncAchievements(supabase)]);

  revalidatePath("/", "layout");
  return { ok: true, alert, unlocked };
}

export async function updateTransaction(input: TransactionInput): Promise<TransactionResult> {
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const { id, ...changes } = parsed.data;
  const supabase = await createClient();
  const { data: previous } = await supabase.from("transactions").select("monto, category_id, fecha").eq("id", id).maybeSingle();
  const { error } = await supabase.from("transactions").update(changes).eq("id", id);
  if (error) {
    console.error("[updateTransaction]", error.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  // Solo cuenta lo que ya estaba en la misma categoría y mes.
  const sameBucket =
    previous && previous.category_id === changes.category_id && previous.fecha.slice(0, 7) === changes.fecha.slice(0, 7);
  const alert = await budgetAlertFor(supabase, parsed.data, sameBucket ? previous.monto : 0);

  revalidatePath("/", "layout");
  return { ok: true, alert };
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: GENERIC_ERROR };

  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) {
    console.error("[deleteTransaction]", error.message);
    return { ok: false, error: "No pudimos eliminarlo. Intenta de nuevo 🌧️" };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
