import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Dashboard } from "@/components/features/dashboard/dashboard";
import { syncAchievements } from "@/lib/actions/achievements";
import { LESSONS } from "@/lib/content/lessons";
import { getDashboardData, getLessonProgress, getSession } from "@/lib/data/queries";
import { monthBounds, shiftMonth } from "@/lib/finance/dates";
import { greetingFor, hourInBogota, todayInBogota } from "@/lib/finance/format";
import { currentPeriod } from "@/lib/finance/period";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Inicio" };

export default async function InicioPage() {
  const { profile } = await getSession();
  if (!profile) redirect("/login");

  const today = todayInBogota();
  const period = currentPeriod(profile.frecuencia_pago, profile.dias_pago, today);
  const prevMonthStart = monthBounds(shiftMonth(today.slice(0, 7), -1)).start;
  const from = period.start < prevMonthStart ? period.start : prevMonthStart;

  const [data, progress, justUnlocked] = await Promise.all([
    getDashboardData(from),
    getLessonProgress(),
    syncAchievements(await createClient()),
  ]);
  const next = LESSONS.find((l) => !(l.slug in progress)) ?? null;

  return (
    <Dashboard
      profile={{
        nombre: profile.nombre || "linda",
        avatar_emoji: profile.avatar_emoji,
        frecuencia_pago: profile.frecuencia_pago,
        dias_pago: profile.dias_pago,
        ingreso_estimado: profile.ingreso_estimado,
      }}
      today={today}
      greeting={greetingFor(hourInBogota())}
      data={data}
      school={{
        done: LESSONS.filter((l) => l.slug in progress).length,
        total: LESSONS.length,
        next: next ? { slug: next.slug, title: next.title, minutes: next.minutes } : null,
      }}
      justUnlocked={justUnlocked}
    />
  );
}
