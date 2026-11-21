"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ACHIEVEMENTS, type AchievementCode } from "@/lib/content/achievements";
import { haptic } from "@/lib/utils";
import { GoalFlower } from "./goal-flower";

type CelebrationProps = {
  open: boolean;
  nombre: string;
  goal: { nombre: string; emoji: string; color: string };
  unlocked: AchievementCode[];
  onClose: () => void;
};

const COLORS = ["#D97BA6", "#F6D6E4", "#C9B6E4", "#FFD3B6", "#8FD5B6"];

/** Pantalla completa de celebración al cumplir una meta. */
export function Celebration({ open, nombre, goal, unlocked, onClose }: CelebrationProps) {
  useEffect(() => {
    if (!open) return;
    haptic(30);
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      const shoot = () => {
        confetti({ particleCount: 70, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors: COLORS, disableForReducedMotion: true, zIndex: 80 });
        confetti({ particleCount: 70, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors: COLORS, disableForReducedMotion: true, zIndex: 80 });
      };
      shoot();
      let n = 0;
      interval = setInterval(() => {
        n += 1;
        shoot();
        if (n >= 3 && interval) clearInterval(interval);
      }, 700);
    });
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="¡Meta cumplida!"
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-hero px-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 160, damping: 12 }}>
            <GoalFlower stage={4} color={goal.color} className="size-56" label="Flor abierta" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-2 font-display text-4xl font-semibold"
          >
            ¡Lo lograste, {nombre}! 💖
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-2 max-w-xs text-lg">
            Tu flor <span className="font-bold">{goal.emoji} {goal.nombre}</span> floreció por completo
          </motion.p>

          {unlocked.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, type: "spring" }}
              className="mt-6 flex w-full max-w-xs flex-col gap-2"
            >
              {unlocked.map((code) => (
                <div key={code} className="glass flex items-center gap-3 rounded-3xl px-4 py-3 text-left">
                  <span className="text-3xl" aria-hidden>
                    {ACHIEVEMENTS[code].emoji}
                  </span>
                  <span>
                    <span className="block text-xs font-bold uppercase tracking-wider text-primary-deep">Logro desbloqueado</span>
                    <span className="block font-bold">{ACHIEVEMENTS[code].titulo}</span>
                  </span>
                </div>
              ))}
            </motion.div>
          ) : null}

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mt-8 w-full max-w-xs">
            <Button size="lg" className="w-full" onClick={onClose}>
              Seguir floreciendo 🌷
            </Button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
