"use client";

import { toast } from "sonner";
import { ACHIEVEMENTS, type AchievementCode } from "@/lib/content/achievements";

const isCode = (c: string): c is AchievementCode => c in ACHIEVEMENTS;

/** Muestra un toast por cada logro recién desbloqueado. */
export function announceAchievements(codes: readonly string[] | undefined) {
  for (const code of codes ?? []) {
    if (!isCode(code)) continue;
    const a = ACHIEVEMENTS[code];
    toast(`${a.emoji} ¡Logro desbloqueado: ${a.titulo}!`, { description: a.descripcion, duration: 5000 });
  }
}
