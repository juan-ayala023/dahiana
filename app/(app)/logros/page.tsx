import type { Metadata } from "next";
import { AchievementsView } from "@/components/features/achievements/achievements-view";
import { syncAchievements } from "@/lib/actions/achievements";
import { getAchievementsData } from "@/lib/data/queries";
import { todayInBogota } from "@/lib/finance/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mis logros" };

export default async function LogrosPage() {
  // Revisa condiciones pendientes (racha, mes dentro del presupuesto…) antes de mostrar.
  const justUnlocked = await syncAchievements(await createClient());
  const { unlocked, dates } = await getAchievementsData();

  return <AchievementsView unlocked={unlocked} dates={dates} today={todayInBogota()} justUnlocked={justUnlocked} />;
}
