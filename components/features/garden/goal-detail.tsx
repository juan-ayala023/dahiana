"use client";

import { startTransition, useOptimistic, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Pause, Pencil, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { contribute, deleteContribution, deleteGoal, setGoalPaused } from "@/lib/actions/goals";
import { ACHIEVEMENTS, type AchievementCode } from "@/lib/content/achievements";
import type { GoalProgress } from "@/lib/data/queries";
import { dayLabel, shortDate } from "@/lib/finance/dates";
import { formatCOP, todayInBogota } from "@/lib/finance/format";
import { goalStage, STAGE_LABELS, suggestedContribution } from "@/lib/finance/goals";
import { haptic } from "@/lib/utils";
import type { FrecuenciaPago, Tables } from "@/types/database";
import { Celebration } from "./celebration";
import { ContributeSheet } from "./contribute-sheet";
import { GoalFlower } from "./goal-flower";
import { GoalFormSheet } from "./goal-form-sheet";

type GoalDetailProps = {
  goal: GoalProgress;
  contributions: Tables<"goal_contributions">[];
  frecuencia: FrecuenciaPago;
  nombre: string;
};

export function GoalDetail({ goal, contributions, frecuencia, nombre }: GoalDetailProps) {
  const router = useRouter();
  const today = todayInBogota();
  const [actual, addOptimistic] = useOptimistic(goal.monto_actual, (state, delta: number) => state + delta);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [contributeKey, setContributeKey] = useState(0);
  const [editOpen, setEditOpen] = useState(0);
  const [watering, setWatering] = useState(false);
  const [celebrate, setCelebrate] = useState<AchievementCode[] | null>(null);
  const [confirmDeleteGoal, setConfirmDeleteGoal] = useState(false);
  const [toDelete, setToDelete] = useState<Tables<"goal_contributions"> | null>(null);

  const porcentaje = Math.min(100, (actual / goal.monto_objetivo) * 100);
  const stage = goalStage(porcentaje);
  const restante = Math.max(0, goal.monto_objetivo - actual);
  const suggested = suggestedContribution({ ...goal, monto_actual: actual }, frecuencia, today);
  const periodo = frecuencia === "quincenal" ? "quincena" : "mes";
  const cumplida = goal.estado === "cumplida" || porcentaje >= 100;
  const pausada = goal.estado === "pausada";
  const fechaPasada = goal.fecha_objetivo !== null && goal.fecha_objetivo < today && !cumplida;

  const onContribute = (monto: number, nota: string) => {
    setContributeOpen(false);
    setWatering(true);
    haptic(15);
    setTimeout(() => setWatering(false), 1400);
    startTransition(async () => {
      addOptimistic(monto);
      const res = await contribute({ goal_id: goal.id, monto, nota: nota || null, fecha: today });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (res.completed) {
        setTimeout(() => setCelebrate(res.unlocked), 900);
      } else {
        toast.success(`¡Regaste tu flor con ${formatCOP(monto)}! 💧`);
        for (const code of res.unlocked) {
          toast(`${ACHIEVEMENTS[code].emoji} Logro desbloqueado: ${ACHIEVEMENTS[code].titulo}`);
        }
      }
    });
  };

  const togglePause = () => {
    startTransition(async () => {
      const res = await setGoalPaused(goal.id, !pausada);
      if (res.ok) toast(pausada ? "Meta reanudada 🌱" : "Meta en pausa. Aquí te espera 💤");
      else toast.error(res.error);
    });
  };

  const message = cumplida
    ? "¡Meta cumplida! Tu flor está en todo su esplendor 🌸"
    : pausada
      ? "Esta meta está en pausa. Reanúdala cuando quieras 💤"
      : fechaPasada
        ? "La fecha ya pasó, pero no pasa nada. ¿Le ponemos una nueva? 🗓️"
        : suggested !== null
          ? `Ahorra ${formatCOP(suggested)} por ${periodo} para llegar a tiempo (${shortDate(goal.fecha_objetivo!)})`
          : "Ponle una fecha y te digo cuánto ahorrar cada " + periodo + " ✨";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <Link
          href="/jardin"
          className="flex size-11 items-center justify-center rounded-full bg-surface shadow-soft active:scale-95"
          aria-label="Volver a Mi Jardín"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <div className="flex gap-1">
          <IconButton label="Editar meta" onClick={() => setEditOpen((n) => n + 1)}>
            <Pencil className="size-5" aria-hidden />
          </IconButton>
          {!cumplida ? (
            <IconButton label={pausada ? "Reanudar meta" : "Pausar meta"} onClick={togglePause}>
              {pausada ? <Play className="size-5" aria-hidden /> : <Pause className="size-5" aria-hidden />}
            </IconButton>
          ) : null}
          <IconButton label="Eliminar meta" onClick={() => setConfirmDeleteGoal(true)} danger>
            <Trash2 className="size-5" aria-hidden />
          </IconButton>
        </div>
      </div>

      {/* Flor */}
      <section className="relative flex flex-col items-center overflow-hidden rounded-4xl bg-hero px-6 pb-6 pt-4 text-center shadow-soft">
        <div className="relative">
          <GoalFlower stage={stage} color={goal.color} className="size-56" label={`${STAGE_LABELS[stage]}: ${Math.round(porcentaje)}%`} />
          <AnimatePresence>
            {watering ? (
              <motion.div className="pointer-events-none absolute inset-0" initial={{ opacity: 1 }} exit={{ opacity: 0 }} aria-hidden>
                <motion.span
                  className="absolute -top-2 right-2 text-4xl"
                  initial={{ rotate: 0, x: 20, opacity: 0 }}
                  animate={{ rotate: -35, x: 0, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  🫖
                </motion.span>
                {Array.from({ length: 7 }, (_, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-lg"
                    style={{ left: `${38 + i * 5}%`, top: "12%" }}
                    initial={{ y: 0, opacity: 0 }}
                    animate={{ y: 110, opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 0.9, delay: 0.3 + i * 0.08, ease: "easeIn" }}
                  >
                    💧
                  </motion.span>
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        <p className="text-sm font-bold uppercase tracking-wider text-primary-deep">
          {STAGE_LABELS[stage]} · {Math.round(porcentaje)}%
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold">
          {goal.emoji} {goal.nombre}
        </h1>
        <p className="mt-2 font-display text-xl tabular">
          <AnimatedNumber value={actual} className="font-semibold" />
          <span className="text-muted-foreground"> de {formatCOP(goal.monto_objetivo)}</span>
        </p>
        <div
          className="mt-3 h-3 w-full overflow-hidden rounded-full bg-white/70"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(porcentaje)}
          aria-label="Avance de la meta"
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: goal.color }}
            initial={false}
            animate={{ width: `${Math.max(2, porcentaje)}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 18 }}
          />
        </div>
        {/* Marcas de etapas */}
        <div className="mt-1 flex w-full justify-between text-[11px] text-muted-foreground" aria-hidden>
          {["🌰", "🌱", "🌿", "🌷", "🌸"].map((e, i) => (
            <span key={e} className={i <= stage ? "opacity-100" : "opacity-40"}>
              {e}
            </span>
          ))}
        </div>
      </section>

      <p className="rounded-3xl bg-surface p-4 text-center font-medium shadow-soft">{message}</p>

      {!cumplida && !pausada ? (
        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            setContributeKey((k) => k + 1);
            setContributeOpen(true);
          }}
        >
          Abonar 💧
        </Button>
      ) : null}

      {/* Historial */}
      <section aria-labelledby="abonos" className="rounded-4xl bg-surface p-5 shadow-soft">
        <h2 id="abonos" className="font-display text-xl font-semibold">
          Abonos
        </h2>
        {contributions.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground">Aún no has regado esta flor. ¡El primer abono es el más bonito! 💧</p>
        ) : (
          <ul className="mt-2 flex flex-col divide-y divide-border">
            {contributions.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <span className="text-xl" aria-hidden>
                  💧
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold tabular">{formatCOP(c.monto)}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {dayLabel(c.fecha, today)}
                    {c.nota ? ` · ${c.nota}` : ""}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setToDelete(c)}
                  className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-expense/20 hover:text-danger"
                  aria-label={`Eliminar abono de ${formatCOP(c.monto)}`}
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ContributeSheet
        key={contributeKey}
        open={contributeOpen}
        onClose={() => setContributeOpen(false)}
        goal={{ nombre: goal.nombre, emoji: goal.emoji, restante }}
        suggested={suggested}
        onSubmit={onContribute}
      />

      {editOpen > 0 ? (
        <GoalFormSheet
          key={editOpen}
          open
          onClose={() => setEditOpen(0)}
          initial={{
            id: goal.id,
            nombre: goal.nombre,
            emoji: goal.emoji,
            color: goal.color,
            monto_objetivo: goal.monto_objetivo,
            fecha_objetivo: goal.fecha_objetivo,
            es_fondo_emergencia: goal.es_fondo_emergencia,
          }}
        />
      ) : null}

      <Celebration
        open={celebrate !== null}
        nombre={nombre}
        goal={goal}
        unlocked={celebrate ?? []}
        onClose={() => setCelebrate(null)}
      />

      <ConfirmDialog
        open={confirmDeleteGoal}
        title="¿Eliminar esta meta?"
        description="Se borran también sus abonos. No se puede deshacer."
        confirmLabel="Sí, eliminar"
        onCancel={() => setConfirmDeleteGoal(false)}
        onConfirm={() => {
          setConfirmDeleteGoal(false);
          startTransition(async () => {
            const res = await deleteGoal(goal.id);
            if (res.ok) {
              toast("Meta eliminada 🍂");
              router.push("/jardin");
            } else toast.error(res.error);
          });
        }}
      />

      <ConfirmDialog
        open={toDelete !== null}
        title="¿Eliminar este abono?"
        description={toDelete ? `${formatCOP(toDelete.monto)} · tu flor se encogerá un poquito.` : undefined}
        confirmLabel="Sí, eliminar"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          const c = toDelete;
          setToDelete(null);
          if (!c) return;
          startTransition(async () => {
            addOptimistic(-c.monto);
            const res = await deleteContribution(c.id);
            if (!res.ok) toast.error(res.error);
          });
        }}
      />
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex size-11 items-center justify-center rounded-full bg-surface shadow-soft active:scale-95 ${danger ? "text-danger" : "text-foreground"}`}
    >
      {children}
    </button>
  );
}
