"use server";

import { normalizeText } from "@/lib/finance/transactions";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema, type OnboardingInput } from "@/lib/validations/onboarding";
import type { ActionResult } from "@/lib/validations/transaction";

/**
 * Guarda el onboarding: gastos fijos, primera meta y, al final, el perfil
 * (marcarlo completo de último permite reintentar si algo falla a mitad).
 */
export async function completeOnboarding(input: OnboardingInput): Promise<ActionResult> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa los datos" };
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Tu sesión expiró. Abre de nuevo tu enlace 💌" };

  const fail = (where: string, message: string): ActionResult => {
    console.error(`[completeOnboarding:${where}]`, message);
    return { ok: false, error: "No pudimos guardar todo. Intenta de nuevo 🌧️" };
  };

  // Reintento seguro: si ya había gastos fijos de un intento anterior, se reemplazan.
  const { error: cleanError } = await supabase.from("recurring_expenses").delete().eq("user_id", user.id);
  if (cleanError) return fail("limpiar", cleanError.message);

  if (data.gastos_fijos.length > 0) {
    const { data: categories, error: catError } = await supabase
      .from("categories")
      .select("id, nombre")
      .eq("tipo", "gasto");
    if (catError) return fail("categorias", catError.message);

    const byName = new Map(categories.map((c) => [normalizeText(c.nombre), c.id]));
    const otros = byName.get("otros") ?? null;

    const { error } = await supabase.from("recurring_expenses").insert(
      data.gastos_fijos.map((g) => ({
        nombre: g.nombre,
        monto: g.monto,
        dia_mes: g.dia_mes,
        category_id: (g.categoria && byName.get(normalizeText(g.categoria))) || otros,
      })),
    );
    if (error) return fail("fijos", error.message);
  }

  if (data.meta) {
    const { count } = await supabase.from("savings_goals").select("id", { count: "exact", head: true });
    if (!count) {
      const { error } = await supabase.from("savings_goals").insert(data.meta);
      if (error) return fail("meta", error.message);
    }
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      nombre: data.nombre,
      avatar_emoji: data.avatar_emoji,
      frecuencia_pago: data.frecuencia_pago,
      dias_pago: data.dias_pago,
      ingreso_estimado: data.ingreso_estimado,
      onboarding_completo: true,
    })
    .eq("id", user.id);
  if (profileError) return fail("perfil", profileError.message);

  return { ok: true };
}
