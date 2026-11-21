"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { GoalStage } from "@/lib/finance/goals";
import { cn } from "@/lib/utils";

type GoalFlowerProps = {
  stage: GoalStage;
  color: string;
  className?: string;
  /** Balanceo suave continuo (desactivado en miniaturas de listas largas). */
  sway?: boolean;
  label?: string;
};

/** Altura del tallo (y superior) por etapa. La tierra está en y=132. */
const STEM_TOP: Record<GoalStage, number> = { 0: 132, 1: 108, 2: 82, 3: 64, 4: 58 };
const spring = { type: "spring", stiffness: 120, damping: 14 } as const;

/**
 * Flor SVG que crece en 5 etapas:
 * semilla (0%) → brote (25%) → tallo (50%) → capullo (75%) → flor abierta (100%).
 */
export function GoalFlower({ stage, color, className, sway = true, label }: GoalFlowerProps) {
  const reduce = useReducedMotion();
  const top = STEM_TOP[stage];
  const gradId = `petal-${color.replace("#", "")}`;
  const leafScale = stage >= 2 ? 1 : stage === 1 ? 0.6 : 0;

  return (
    <svg viewBox="0 0 120 150" className={cn("size-32", className)} role="img" aria-label={label}>
      <defs>
        <radialGradient id={gradId} cx="0.5" cy="0.25" r="0.9">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="45%" stopColor={color} />
          <stop offset="100%" stopColor={color} />
        </radialGradient>
        <radialGradient id="flower-core" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0%" stopColor="#FFF4E0" />
          <stop offset="100%" stopColor="#FFC27A" />
        </radialGradient>
        <linearGradient id="soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B88A72" />
          <stop offset="100%" stopColor="#8C6352" />
        </linearGradient>
      </defs>

      {/* Maceta */}
      <path d="M30 128 h60 l-7 20 h-46 z" fill="#F2B8A0" />
      <rect x="26" y="122" width="68" height="10" rx="5" fill="#F7C9B4" />
      <ellipse cx="60" cy="124" rx="30" ry="4" fill="url(#soil)" />

      <motion.g
        style={{ originX: 0.5, originY: 1 }}
        animate={sway && !reduce && stage > 0 ? { rotate: [0, 2.5, -2, 0] } : { rotate: 0 }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Semilla */}
        <AnimatePresence>
          {stage === 0 ? (
            <motion.ellipse
              key="seed"
              cx="60"
              cy="121"
              rx="6"
              ry="4.5"
              fill="#8C5A3C"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, y: reduce ? 0 : [0, -1.5, 0] }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ y: { duration: 2.4, repeat: Infinity }, default: spring }}
              style={{ originX: 0.5, originY: 0.5 }}
            />
          ) : null}
        </AnimatePresence>

        {/* Tallo */}
        <motion.line
          x1="60"
          x2="60"
          y1="124"
          stroke="#6FBF8E"
          strokeWidth="4"
          strokeLinecap="round"
          initial={false}
          animate={{ y2: top, opacity: stage === 0 ? 0 : 1 }}
          transition={spring}
        />

        {/* Hojas */}
        <motion.path
          d="M60 112 C 44 108, 38 96, 40 90 C 50 92, 58 100, 60 112 Z"
          fill="#8FD5B6"
          initial={false}
          animate={{ scale: leafScale, opacity: leafScale ? 1 : 0 }}
          transition={{ ...spring, delay: 0.1 }}
          style={{ originX: 1, originY: 1 }}
        />
        <motion.path
          d="M60 102 C 76 98, 82 86, 80 80 C 70 82, 62 90, 60 102 Z"
          fill="#7CCBA6"
          initial={false}
          animate={{ scale: stage >= 2 ? 1 : 0, opacity: stage >= 2 ? 1 : 0 }}
          transition={{ ...spring, delay: 0.2 }}
          style={{ originX: 0, originY: 1 }}
        />

        {/* Capullo */}
        <AnimatePresence>
          {stage === 3 ? (
            <motion.path
              key="bud"
              d="M60 40 C 70 50, 70 62, 60 66 C 50 62, 50 50, 60 40 Z"
              fill={`url(#${gradId})`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.3, opacity: 0 }}
              transition={{ ...spring, delay: 0.25 }}
              style={{ originX: 0.5, originY: 1 }}
            />
          ) : null}
        </AnimatePresence>

        {/* Flor abierta */}
        <AnimatePresence>
          {stage === 4 ? (
            <motion.g
              key="bloom"
              initial={{ rotate: -35 }}
              animate={{ rotate: 0 }}
              transition={spring}
              style={{ originX: 0.5, originY: 0.5 }}
            >
              {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                <g key={deg} transform={`rotate(${deg} 60 50)`}>
                  <motion.ellipse
                    cx="60"
                    cy="36"
                    rx="9"
                    ry="15"
                    fill={`url(#${gradId})`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ ...spring, delay: 0.2 + i * 0.06 }}
                    style={{ originX: 0.5, originY: 1 }}
                  />
                </g>
              ))}
              <motion.circle
                cx="60"
                cy="50"
                r="8"
                fill="url(#flower-core)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ ...spring, delay: 0.6 }}
                style={{ originX: 0.5, originY: 0.5 }}
              />
            </motion.g>
          ) : null}
        </AnimatePresence>
      </motion.g>
    </svg>
  );
}
