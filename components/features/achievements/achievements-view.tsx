"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Lock } from "lucide-react";
import { ACHIEVEMENT_CODES, ACHIEVEMENTS } from "@/lib/content/achievements";
import { addDaysKey, dayLabel } from "@/lib/finance/dates";
import { streakStats } from "@/lib/finance/streak";
import { cn } from "@/lib/utils";

type Props = { unlocked: Record<string, string>; dates: string[]; today: string; justUnlocked: string[] };

export function AchievementsView({ unlocked, dates, today, justUnlocked }: Props) {
  const streak = streakStats(dates, today);
  const set = new Set(dates);
  const last28 = Array.from({ length: 28 }, (_, i) => addDaysKey(today, i - 27));
  const unlockedCount = ACHIEVEMENT_CODES.filter((c) => c in unlocked).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/inicio"
          className="flex size-11 items-center justify-center rounded-full bg-surface shadow-soft active:scale-95"
          aria-label="Volver al inicio"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <h1 className="font-display text-3xl font-semibold">Mis logros 🏆</h1>
      </div>

      {/* Racha */}
      <section aria-labelledby="racha" className="relative overflow-hidden rounded-4xl bg-hero p-5 shadow-soft">
        <div className="flex items-center gap-4">
          <motion.span
            className="text-6xl"
            animate={streak.current > 0 ? { scale: [1, 1.12, 1], rotate: [0, -4, 4, 0] } : {}}
            transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 0.8 }}
            aria-hidden
          >
            {streak.current > 0 ? "🔥" : "🌱"}
          </motion.span>
          <div>
            <h2 id="racha" className="text-sm font-bold uppercase tracking-wider text-primary-deep">
              Racha actual
            </h2>
            <p className="font-display text-4xl font-semibold tabular">
              {streak.current} {streak.current === 1 ? "día" : "días"}
            </p>
            <p className="text-sm text-foreground/80">
              Tu récord: {streak.longest} {streak.longest === 1 ? "día" : "días"}
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm font-medium">
          {streak.registeredToday
            ? "¡Ya registraste hoy! Vuelve mañana para seguir sumando ✨"
            : streak.current > 0
              ? "Registra algo hoy para no perder tu racha 💪"
              : "Registra un gasto o ingreso hoy para empezar tu racha 🌱"}
        </p>

        <div className="mt-4 grid grid-cols-7 gap-1.5" role="list" aria-label="Últimos 28 días">
          {last28.map((d) => {
            const active = set.has(d);
            return (
              <span
                key={d}
                role="listitem"
                aria-label={`${dayLabel(d, today)}: ${active ? "registraste" : "sin registro"}`}
                className={cn(
                  "aspect-square rounded-lg",
                  active ? "bg-primary-strong" : "bg-white/60",
                  d === today && "ring-2 ring-primary-deep ring-offset-1 ring-offset-transparent",
                )}
              />
            );
          })}
        </div>
      </section>

      {/* Insignias */}
      <section aria-labelledby="insignias">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="insignias" className="font-display text-xl font-semibold">
            Insignias
          </h2>
          <p className="text-sm text-muted-foreground">
            {unlockedCount} de {ACHIEVEMENT_CODES.length}
          </p>
        </div>
        <ul className="grid grid-cols-2 gap-3">
          {ACHIEVEMENT_CODES.map((code, i) => {
            const a = ACHIEVEMENTS[code];
            const date = unlocked[code];
            const isNew = justUnlocked.includes(code);
            return (
              <motion.li
                key={code}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-4xl p-4 text-center",
                  date ? "bg-surface shadow-soft" : "bg-white/40",
                )}
              >
                {isNew ? (
                  <span className="absolute right-3 top-3 rounded-full bg-primary-strong px-2 py-0.5 text-[10px] font-bold text-white">
                    ¡Nuevo!
                  </span>
                ) : null}
                <motion.span
                  className={cn("flex size-16 items-center justify-center rounded-full text-4xl", date ? "bg-primary-soft/60" : "bg-white/60 grayscale")}
                  animate={isNew ? { scale: [0.6, 1.2, 1], rotate: [0, -10, 10, 0] } : {}}
                  transition={{ duration: 0.8 }}
                  aria-hidden
                >
                  {date ? a.emoji : <Lock className="size-6 text-faint" />}
                </motion.span>
                <p className={cn("font-bold leading-tight", !date && "text-muted-foreground")}>{a.titulo}</p>
                <p className="text-xs text-muted-foreground">{a.descripcion}</p>
                {date ? (
                  <p className="mt-1 text-[11px] font-semibold text-primary-deep">
                    {dayLabel(date.slice(0, 10), today)}
                  </p>
                ) : null}
                <span className="sr-only">{date ? "Desbloqueado" : "Bloqueado"}</span>
              </motion.li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
