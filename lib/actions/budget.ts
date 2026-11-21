"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { todayInBogota } from "@/lib/finance/format";
import { createClient } from "@/lib/supabase/server";
import { budgetSchema, firstOfMonth, recurringSchema, type RecurringInput } from "@/lib/validations/budget";
import type { ActionResult } from "@/lib/validations/transaction";
import type { ClasificacionGasto } from "@/types/database";

const GENERIC = "No pudimos guardar. Revisa tu conexión e intenta de nuevo 🌧️";
const uuid = z.string().uuid();

function revalidateBudget() {
  revalidatePath("/presupuesto");
  revalidatePath("/inicio");
}

/** Define (o quita, con limite = null) el límite mensual de una categoría. */
export async function setBudget(input: z.input<typeof budgetSchema>): Promise<ActionResult> {
  const parsed = budgetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? GENERIC };
  const { category_id, mes, limite } = parsed.data;

  const supabase = await createClient();
  const { error } =
    limite === null
      ? await supabase.from("budgets").delete().eq("category_id", category_id).eq("mes", mes)
      : await supabase.from("budgets").upsert({ category_id, mes, limite }, { onConflict: "user_id,category_id,mes" });

  if (error) {
    console.error("[setBudget]", error.message);
    return { ok: false, error: GENERIC };
  }
  revalidateBudget();
  return { ok: true };
}

/** Copia los límites de un mes a otro (sin pisar los que ya existan). */
export async function copyBudgets(fromMes: string, toMes: string): Promise<ActionResult> {
  if (!firstOfMonth.safeParse(fromMes).success || !firstOfMonth.safeParse(toMes).success) {
    return { ok: false, error: GENERIC };
  }
  const supabase = await createClient();
  const { data: previous, error: readError } = await supabase.from("budgets").select("category_id, limite").eq("mes", fromMes);
  if (readError) return { ok: false, error: GENERIC };
  if (!previous?.length) return { ok: false, error: "El mes pasado no tenía límites 🤔" };

  const { error } = await supabase
    .from("budgets")
    .upsert(
      previous.map((b) => ({ category_id: b.category_id, limite: b.limite, mes: toMes })),
      { onConflict: "user_id,category_id,mes", ignoreDuplicates: true },
    );
  if (error) return { ok: false, error: GENERIC };
  revalidateBudget();
  return { ok: true };
}

export async function setCategoryClassification(categoryId: string, clasificacion: ClasificacionGasto): Promise<ActionResult> {
  if (!uuid.safeParse(categoryId).success || !["necesidad", "gusto", "ahorro"].includes(clasificacion)) {
    return { ok: false, error: GENERIC };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("categories").update({ clasificacion }).eq("id", categoryId).eq("tipo", "gasto");
  if (error) return { ok: false, error: GENERIC };
  revalidatePath("/", "layout");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Gastos fijos
// ---------------------------------------------------------------------------

export async function saveRecurring(id: string | null, input: RecurringInput): Promise<ActionResult> {
  const parsed = recurringSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? GENERIC };
  if (id !== null && !uuid.safeParse(id).success) return { ok: false, error: GENERIC };

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("recurring_expenses").update(parsed.data).eq("id", id)
    : await supabase.from("recurring_expenses").insert(parsed.data);
  if (error) {
    console.error("[saveRecurring]", error.message);
    return { ok: false, error: GENERIC };
  }
  revalidateBudget();
  return { ok: true };
}

export async function deleteRecurring(id: string): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return { ok: false, error: GENERIC };
  const supabase = await createClient();
  const { error } = await supabase.from("recurring_expenses").delete().eq("id", id);
  if (error) return { ok: false, error: "No pudimos eliminarlo 🌧️" };
  revalidateBudget();
  return { ok: true };
}

/** Registra el pago del gasto fijo de hoy como un movimiento (nota = nombre del gasto fijo). */
export async function markRecurringPaid(id: string): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return { ok: false, error: GENERIC };
  const supabase = await createClient();
  const { data: rec, error: readError } = await supabase
    .from("recurring_expenses")
    .select("nombre, monto, category_id")
    .eq("id", id)
    .maybeSingle();
  if (readError || !rec) return { ok: false, error: GENERIC };

  let categoryId = rec.category_id;
  if (!categoryId) {
    const { data: otros } = await supabase
      .from("categories")
      .select("id")
      .eq("tipo", "gasto")
      .eq("nombre", "Otros")
      .maybeSingle();
    categoryId = otros?.id ?? null;
  }

  const { error } = await supabase.from("transactions").insert({
    tipo: "gasto",
    monto: rec.monto,
    category_id: categoryId,
    nota: rec.nombre,
    fecha: todayInBogota(),
  });
  if (error) {
    console.error("[markRecurringPaid]", error.message);
    return { ok: false, error: GENERIC };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
