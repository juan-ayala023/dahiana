"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { AchievementCode } from "@/lib/content/achievements";
import { createClient } from "@/lib/supabase/server";
import { contributionSchema, goalSchema, type ContributionInput, type GoalInput } from "@/lib/validations/goal";
import type { ActionResult } from "@/lib/validations/transaction";
import { unlockAchievements } from "./achievements";

const GENERIC = "No pudimos guardar. Revisa tu conexión e intenta de nuevo 🌧️";
const uuid = z.string().uuid();

function revalidateGarden() {
  revalidatePath("/jardin", "layout");
  revalidatePath("/inicio");
}

export async function createGoal(input: GoalInput): Promise<ActionResult & { id?: string }> {
  const parsed = goalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? GENERIC };

  const supabase = await createClient();
  const { data, error } = await supabase.from("savings_goals").insert(parsed.data).select("id").single();
  if (error) {
    console.error("[createGoal]", error.message);
    return { ok: false, error: GENERIC };
  }
  revalidateGarden();
  return { ok: true, id: data.id };
}

export async function updateGoal(id: string, input: GoalInput): Promise<ActionResult> {
  const parsed = goalSchema.safeParse(input);
  if (!uuid.safeParse(id).success || !parsed.success) {
    return { ok: false, error: parsed.success ? GENERIC : (parsed.error.issues[0]?.message ?? GENERIC) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("savings_goals").update(parsed.data).eq("id", id);
  if (error) {
    console.error("[updateGoal]", error.message);
    return { ok: false, error: GENERIC };
  }
  await syncGoalState(supabase, id);
  revalidateGarden();
  return { ok: true };
}

export async function setGoalPaused(id: string, paused: boolean): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return { ok: false, error: GENERIC };
  const supabase = await createClient();
  const { error } = await supabase
    .from("savings_goals")
    .update({ estado: paused ? "pausada" : "activa" })
    .eq("id", id)
    .neq("estado", "cumplida");
  if (error) return { ok: false, error: GENERIC };
  revalidateGarden();
  return { ok: true };
}

export async function deleteGoal(id: string): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return { ok: false, error: GENERIC };
  const supabase = await createClient();
  const { error } = await supabase.from("savings_goals").delete().eq("id", id);
  if (error) return { ok: false, error: "No pudimos eliminarla. Intenta de nuevo 🌧️" };
  revalidateGarden();
  return { ok: true };
}

export type ContributeResult =
  | { ok: true; completed: boolean; porcentaje: number; unlocked: AchievementCode[] }
  | { ok: false; error: string };

/** Abona a una meta. Si llega al 100% la marca como cumplida y desbloquea logros. */
export async function contribute(input: ContributionInput): Promise<ContributeResult> {
  const parsed = contributionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? GENERIC };

  const supabase = await createClient();
  const { error } = await supabase.from("goal_contributions").insert(parsed.data);
  if (error) {
    console.error("[contribute]", error.message);
    return { ok: false, error: GENERIC };
  }

  const state = await syncGoalState(supabase, parsed.data.goal_id);
  const codes: AchievementCode[] = ["primer_abono"];
  if (state?.justCompleted) codes.push("primera_meta");
  if (state?.esFondo && state.porcentaje >= 50) codes.push("fondo_50");
  const unlocked = await unlockAchievements(supabase, codes);

  revalidateGarden();
  return { ok: true, completed: state?.justCompleted ?? false, porcentaje: state?.porcentaje ?? 0, unlocked };
}

export async function deleteContribution(id: string): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return { ok: false, error: GENERIC };
  const supabase = await createClient();
  const { data, error } = await supabase.from("goal_contributions").delete().eq("id", id).select("goal_id").maybeSingle();
  if (error) return { ok: false, error: "No pudimos eliminar el abono 🌧️" };
  if (data) await syncGoalState(supabase, data.goal_id);
  revalidateGarden();
  return { ok: true };
}

/**
 * Mantiene el estado coherente con el avance: ≥100% → cumplida; si baja de
 * 100% (se borró un abono o se subió el objetivo) → vuelve a activa.
 */
async function syncGoalState(supabase: Awaited<ReturnType<typeof createClient>>, goalId: string) {
  const { data: g } = await supabase
    .from("savings_goals_progress")
    .select("estado, porcentaje, es_fondo_emergencia")
    .eq("id", goalId)
    .maybeSingle();
  if (!g) return null;

  const porcentaje = Number(g.porcentaje);
  let justCompleted = false;
  if (porcentaje >= 100 && g.estado !== "cumplida") {
    await supabase.from("savings_goals").update({ estado: "cumplida", cumplida_at: new Date().toISOString() }).eq("id", goalId);
    justCompleted = true;
  } else if (porcentaje < 100 && g.estado === "cumplida") {
    await supabase.from("savings_goals").update({ estado: "activa", cumplida_at: null }).eq("id", goalId);
  }
  return { porcentaje, justCompleted, esFondo: g.es_fondo_emergencia };
}
