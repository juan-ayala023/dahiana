import "server-only";
import type { AchievementCode } from "@/lib/content/achievements";
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
