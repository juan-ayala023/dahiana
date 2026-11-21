"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { AchievementCode } from "@/lib/content/achievements";
import { LESSONS, lessonBySlug } from "@/lib/content/lessons";
import { createClient } from "@/lib/supabase/server";
import { unlockAchievements } from "./achievements";

export type LessonResult = { ok: true; unlocked: AchievementCode[]; best: number } | { ok: false; error: string };

/** Guarda el progreso de una lección conservando el mejor puntaje del quiz. */
export async function saveLessonProgress(slug: string, score: number): Promise<LessonResult> {
  if (!lessonBySlug(slug) || !z.number().int().min(0).max(3).safeParse(score).success) {
    return { ok: false, error: "Lección inválida" };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase.from("lesson_progress").select("quiz_score").eq("lesson_slug", slug).maybeSingle();
  const best = Math.max(score, existing?.quiz_score ?? 0);

  const { error } = await supabase
    .from("lesson_progress")
    .upsert(
      { lesson_slug: slug, quiz_score: best, completado_at: new Date().toISOString() },
      { onConflict: "user_id,lesson_slug" },
    );
  if (error) {
    console.error("[saveLessonProgress]", error.message);
    return { ok: false, error: "No pudimos guardar tu progreso 🌧️" };
  }

  const { count } = await supabase.from("lesson_progress").select("id", { count: "exact", head: true });
  const codes: AchievementCode[] = ["primera_leccion"];
  if ((count ?? 0) >= LESSONS.length) codes.push("escuelita_completa");
  const unlocked = await unlockAchievements(supabase, codes);

  revalidatePath("/escuelita");
  revalidatePath("/inicio");
  return { ok: true, unlocked, best };
}
