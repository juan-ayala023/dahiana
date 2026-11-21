"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GoalProgress } from "@/lib/data/queries";
import { formatCOP } from "@/lib/finance/format";
import { goalStage, STAGE_LABELS } from "@/lib/finance/goals";
import { GoalFlower } from "./goal-flower";
import { GoalFormSheet, type GoalDraft } from "./goal-form-sheet";

type GardenViewProps = { goals: GoalProgress[]; fixedMonthly: number };

export function GardenView({ goals, fixedMonthly }: GardenViewProps) {
  const [form, setForm] = useState<{ session: number; initial?: Partial<GoalDraft> } | null>(null);

  const activas = goals.filter((g) => g.estado === "activa");
  const cumplidas = goals.filter((g) => g.estado === "cumplida");
  const pausadas = goals.filter((g) => g.estado === "pausada");
  const hasEmergency = goals.some((g) => g.es_fondo_emergencia);

  const openForm = (initial?: Partial<GoalDraft>) => setForm((f) => ({ session: (f?.session ?? 0) + 1, initial }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Mi jardín 🌷</h1>
          <p className="mt-1 text-muted-foreground">Cada meta es una flor que crece con tus abonos</p>
        </div>
        <Button size="icon" onClick={() => openForm()} aria-label="Nueva meta">
          <Plus aria-hidden />
        </Button>
      </header>

      {!hasEmergency ? (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-4xl bg-peach/40 p-5"
        >
          <span className="text-3xl" aria-hidden>
            🛟
          </span>
          <div className="flex-1">
            <p className="font-bold">Tu red de seguridad</p>
            <p className="mt-1 text-sm">
              Un fondo de emergencia te cubre si algo inesperado pasa. Lo ideal: 3 meses de tus gastos fijos
              {fixedMonthly > 0 ? ` (${formatCOP(fixedMonthly * 3)})` : ""}.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() =>
                openForm({
                  nombre: "Fondo de emergencia",
                  emoji: "🛟",
                  color: "#8EC5E8",
                  monto_objetivo: fixedMonthly > 0 ? fixedMonthly * 3 : undefined,
                  es_fondo_emergencia: true,
                })
              }
            >
              Sembrarlo
            </Button>
          </div>
        </motion.section>
      ) : null}

      {goals.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-4xl bg-surface px-6 py-10 text-center shadow-soft">
          <GoalFlower stage={0} color="#D97BA6" className="size-36" label="Semilla" />
          <p className="font-display text-xl font-semibold">Tu jardín está listo para su primera semilla</p>
          <p className="text-muted-foreground">¿Un viaje, algo que quieres o tu tranquilidad? Ponle nombre y empieza a regarla 💧</p>
          <Button onClick={() => openForm()}>Sembrar mi primera flor 🌱</Button>
        </div>
      ) : null}

      <GoalGrid title="Creciendo" goals={activas} />
      <GoalGrid title="Florecidas 🏆" goals={cumplidas} />
      <GoalGrid title="En pausa 💤" goals={pausadas} muted />

      {form ? (
        <GoalFormSheet key={form.session} open onClose={() => setForm(null)} initial={form.initial} />
      ) : null}
    </div>
  );
}

function GoalGrid({ title, goals, muted = false }: { title: string; goals: GoalProgress[]; muted?: boolean }) {
  if (goals.length === 0) return null;
  return (
    <section aria-label={title}>
      <h2 className="mb-3 font-display text-xl font-semibold">{title}</h2>
      <ul className="grid grid-cols-2 gap-3">
        {goals.map((g, i) => {
          const stage = goalStage(g.porcentaje);
          return (
            <motion.li
              key={g.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/jardin/${g.id}`}
                className={`flex h-full flex-col items-center rounded-4xl bg-surface p-4 text-center shadow-soft transition-transform active:scale-[0.97] ${muted ? "opacity-70" : ""}`}
              >
                <GoalFlower stage={stage} color={g.color} className="size-28" sway={!muted} label={STAGE_LABELS[stage]} />
                <p className="mt-1 line-clamp-2 font-bold leading-tight">
                  {g.emoji} {g.nombre}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {STAGE_LABELS[stage]} · {Math.round(g.porcentaje)}%
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-primary-soft" aria-hidden>
                  <div className="h-full rounded-full" style={{ width: `${Math.max(3, g.porcentaje)}%`, backgroundColor: g.color }} />
                </div>
                <p className="mt-2 text-xs font-semibold tabular">
                  {formatCOP(g.monto_actual)}
                  <span className="font-normal text-muted-foreground"> / {formatCOP(g.monto_objetivo)}</span>
                </p>
              </Link>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
