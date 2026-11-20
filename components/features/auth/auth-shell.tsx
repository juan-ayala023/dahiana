"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Logo } from "@/components/features/brand/logo";

const blobs = [
  { className: "left-[-20%] top-[-10%] size-80 bg-primary-soft", duration: 14 },
  { className: "right-[-25%] top-[20%] size-72 bg-lavender/60", duration: 18 },
  { className: "bottom-[-15%] left-[10%] size-80 bg-peach/70", duration: 16 },
];

const petals = ["🌸", "✨", "🌷", "💖", "✨"];

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/** Fondo con gradiente, manchas flotantes y tarjeta de vidrio para login/registro. */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  const reduce = useReducedMotion();

  return (
    <main className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-hero px-5 pb-10 pt-[max(2.5rem,env(safe-area-inset-top))]">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        {blobs.map((blob, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full blur-3xl ${blob.className}`}
            animate={reduce ? undefined : { x: [0, 24, -12, 0], y: [0, -18, 14, 0], scale: [1, 1.08, 0.96, 1] }}
            transition={{ duration: blob.duration, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
        {!reduce &&
          petals.map((petal, i) => (
            <motion.span
              key={i}
              className="absolute text-xl opacity-60"
              style={{ left: `${12 + i * 18}%`, top: `${10 + (i % 3) * 22}%` }}
              animate={{ y: [0, -14, 0], rotate: [0, 10, -6, 0] }}
              transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
            >
              {petal}
            </motion.span>
          ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto flex w-full max-w-md justify-center"
      >
        <Logo />
      </motion.div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
        <motion.section
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 140, damping: 20, delay: 0.1 }}
          className="glass rounded-4xl p-6 shadow-soft sm:p-8"
        >
          <header className="mb-6 text-center">
            <h1 className="font-display text-3xl font-semibold leading-tight text-foreground">{title}</h1>
            <p className="mt-2 text-muted-foreground">{subtitle}</p>
          </header>
          {children}
        </motion.section>
        {footer ? <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div> : null}
      </div>
    </main>
  );
}
