"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { FlowerMark } from "@/components/features/brand/logo";
import { completeOnboarding } from "@/lib/actions/onboarding";
import { formatCOP, todayInBogota } from "@/lib/finance/format";
import { cn, haptic } from "@/lib/utils";
import type { FrecuenciaPago } from "@/types/database";

const AVATARS = ["🌸", "🌷", "🌻", "🦋", "🐱", "🐰", "🍓", "🌙", "✨", "💅", "👑", "🌈"];
const GOAL_EMOJIS = ["🌷", "✈️", "🛟", "💻", "🏖️", "🎓", "🏠", "🚗", "💍", "🎁"];

const FIXED_SUGGESTIONS = [
  { nombre: "Arriendo", emoji: "🏠", categoria: "Hogar" },
  { nombre: "Servicios", emoji: "💡", categoria: "Hogar" },
  { nombre: "Celular", emoji: "📱", categoria: "Hogar" },
  { nombre: "Internet", emoji: "📶", categoria: "Hogar" },
  { nombre: "Transporte", emoji: "🚌", categoria: "Transporte" },
  { nombre: "Gimnasio", emoji: "🏋️", categoria: "Salud" },
  { nombre: "Suscripciones", emoji: "🎬", categoria: "Otros" },
  { nombre: "Estudio", emoji: "🎓", categoria: "Estudio" },
];

const FREQUENCIES: { value: FrecuenciaPago; emoji: string; title: string; desc: string }[] = [
  { value: "quincenal", emoji: "🗓️", title: "Quincenal", desc: "Me pagan dos veces al mes" },
  { value: "mensual", emoji: "📅", title: "Mensual", desc: "Me pagan una vez al mes" },
  { value: "variable", emoji: "🎈", title: "Variable", desc: "Me entra plata en distintos momentos" },
];

type FixedExpense = { key: string; nombre: string; emoji: string; categoria: string | null; monto: number | null; dia_mes: number };
type Goal = { nombre: string; emoji: string; monto: number | null; fecha: string; es_fondo_emergencia: boolean };

const STEPS = ["nombre", "pago", "ingreso", "fijos", "meta", "listo"] as const;
type Step = (typeof STEPS)[number];

export function OnboardingFlow({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("nombre");
  const [direction, setDirection] = useState(1);
  const [saving, startSaving] = useTransition();

  const [nombre, setNombre] = useState(initialName);
  const [avatar, setAvatar] = useState("🌸");
  const [frecuencia, setFrecuencia] = useState<FrecuenciaPago>("quincenal");
  const [dias, setDias] = useState<[number, number]>([15, 30]);
  const [ingreso, setIngreso] = useState<number | null>(null);
  const [fijos, setFijos] = useState<FixedExpense[]>([]);
  const [customFixed, setCustomFixed] = useState("");
  const [goal, setGoal] = useState<Goal | null>(null);

  const index = STEPS.indexOf(step);
  const totalFijos = useMemo(() => fijos.reduce((s, f) => s + (f.monto ?? 0), 0), [fijos]);

  const go = (to: Step) => {
    setDirection(STEPS.indexOf(to) > index ? 1 : -1);
    setStep(to);
    haptic(5);
  };

  const diasPago = frecuencia === "quincenal" ? [...dias].sort((a, b) => a - b) : frecuencia === "mensual" ? [dias[1]] : [1];

  const addFixed = (nombreFijo: string, emoji = "✨", categoria: string | null = null) => {
    const clean = nombreFijo.trim();
    if (!clean || fijos.some((f) => f.nombre.toLowerCase() === clean.toLowerCase())) return;
    setFijos((list) => [
      ...list,
      { key: `${clean}-${Date.now()}`, nombre: clean, emoji, categoria, monto: null, dia_mes: diasPago[0] ?? 1 },
    ]);
  };

  const updateFixed = (key: string, patch: Partial<FixedExpense>) =>
    setFijos((list) => list.map((f) => (f.key === key ? { ...f, ...patch } : f)));

  const fijosValid = fijos.every((f) => f.monto && f.monto > 0);
  const goalValid = goal === null || (goal.nombre.trim().length > 0 && (goal.monto ?? 0) > 0);

  const submit = (finalGoal: Goal | null) => {
    startSaving(async () => {
      const res = await completeOnboarding({
        nombre: nombre.trim(),
        avatar_emoji: avatar,
        frecuencia_pago: frecuencia,
        dias_pago: diasPago,
        ingreso_estimado: ingreso,
        gastos_fijos: fijos.map((f) => ({
          nombre: f.nombre,
          monto: f.monto ?? 0,
          dia_mes: f.dia_mes,
          categoria: f.categoria,
        })),
        meta: finalGoal
          ? {
              nombre: finalGoal.nombre.trim(),
              emoji: finalGoal.emoji,
              monto_objetivo: finalGoal.monto ?? 0,
              fecha_objetivo: finalGoal.fecha || null,
              es_fondo_emergencia: finalGoal.es_fondo_emergencia,
            }
          : null,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setGoal(finalGoal);
      go("listo");
    });
  };

  return (
    <main className="relative isolate mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-hero opacity-60" aria-hidden />

      {step !== "listo" ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => index > 0 && go(STEPS[index - 1]!)}
            disabled={index === 0}
            className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-opacity hover:bg-white/60 disabled:opacity-0"
            aria-label="Paso anterior"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
          <div
            className="flex flex-1 gap-1.5"
            role="progressbar"
            aria-label="Progreso"
            aria-valuemin={1}
            aria-valuemax={5}
            aria-valuenow={index + 1}
          >
            {STEPS.slice(0, 5).map((s, i) => (
              <span key={s} className="h-2 flex-1 overflow-hidden rounded-full bg-white/70">
                <motion.span
                  className="block h-full rounded-full bg-brand"
                  initial={false}
                  animate={{ width: i <= index ? "100%" : "0%" }}
                  transition={{ duration: 0.4 }}
                />
              </span>
            ))}
          </div>
          <span className="w-11 text-right text-sm font-semibold text-muted-foreground tabular">{index + 1}/5</span>
        </div>
      ) : null}

      <div className="relative flex flex-1 flex-col pt-8">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.section
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-1 flex-col"
          >
            {step === "nombre" && (
              <StepLayout
                emoji="👋"
                title="¡Hola! ¿Cómo te llamas?"
                subtitle="Así te voy a saludar cada día"
                footer={
                  <Button size="lg" className="w-full" disabled={!nombre.trim()} onClick={() => go("pago")}>
                    Siguiente
                  </Button>
                }
              >
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                  maxLength={40}
                  aria-label="Tu nombre"
                  autoComplete="given-name"
                  className="h-14 text-center font-display text-2xl"
                />
                <p className="mt-6 mb-3 text-center font-semibold">Elige tu avatar</p>
                <div role="radiogroup" aria-label="Avatar" className="grid grid-cols-6 gap-2">
                  {AVATARS.map((a) => (
                    <motion.button
                      key={a}
                      type="button"
                      role="radio"
                      aria-checked={avatar === a}
                      aria-label={a}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setAvatar(a)}
                      className={cn(
                        "flex aspect-square items-center justify-center rounded-2xl text-2xl transition-all",
                        avatar === a ? "bg-surface shadow-[0_0_0_3px_var(--primary)]" : "bg-white/60",
                      )}
                    >
                      {a}
                    </motion.button>
                  ))}
                </div>
              </StepLayout>
            )}

            {step === "pago" && (
              <StepLayout
                emoji="💸"
                title="¿Cada cuánto te pagan?"
                subtitle="Con esto calculo cuánto puedes gastar cada día"
                footer={
                  <Button size="lg" className="w-full" onClick={() => go("ingreso")}>
                    Siguiente
                  </Button>
                }
              >
                <div role="radiogroup" aria-label="Frecuencia de pago" className="flex flex-col gap-3">
                  {FREQUENCIES.map((f) => {
                    const active = frecuencia === f.value;
                    return (
                      <motion.button
                        key={f.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setFrecuencia(f.value)}
                        className={cn(
                          "flex items-center gap-4 rounded-3xl bg-surface p-4 text-left shadow-soft transition-shadow",
                          active && "shadow-[0_0_0_3px_var(--primary)]",
                        )}
                      >
                        <span className="text-3xl" aria-hidden>
                          {f.emoji}
                        </span>
                        <span>
                          <span className="block font-bold">{f.title}</span>
                          <span className="block text-sm text-muted-foreground">{f.desc}</span>
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="mt-6">
                  {frecuencia === "quincenal" && (
                    <div className="grid grid-cols-2 gap-3">
                      <DaySelect label="Primer pago" value={dias[0]} onChange={(d) => setDias([d, dias[1]])} />
                      <DaySelect label="Segundo pago" value={dias[1]} onChange={(d) => setDias([dias[0], d])} />
                    </div>
                  )}
                  {frecuencia === "mensual" && (
                    <DaySelect label="¿Qué día te pagan?" value={dias[1]} onChange={(d) => setDias([dias[0], d])} />
                  )}
                  {frecuencia === "variable" && (
                    <p className="rounded-3xl bg-white/70 p-4 text-center text-muted-foreground">
                      Perfecto, haremos las cuentas mes a mes ✨
                    </p>
                  )}
                </div>
              </StepLayout>
            )}

            {step === "ingreso" && (
              <StepLayout
                emoji="🌱"
                title="¿Cuánto ganas al mes, más o menos?"
                subtitle="Es solo un estimado y lo puedes cambiar cuando quieras. Nadie más lo ve 🔒"
                footer={
                  <div className="flex flex-col gap-2">
                    <Button size="lg" className="w-full" onClick={() => go("fijos")}>
                      {ingreso ? "Siguiente" : "Saltar por ahora"}
                    </Button>
                  </div>
                }
              >
                <MoneyInput
                  value={ingreso}
                  onValueChange={setIngreso}
                  placeholder="Ej: 2.500.000"
                  aria-label="Ingreso mensual aproximado"
                  className="h-16 text-center text-3xl"
                />
              </StepLayout>
            )}

            {step === "fijos" && (
              <StepLayout
                emoji="🏠"
                title="Tus gastos fijos"
                subtitle="Lo que pagas todos los meses sí o sí. Toca para agregar"
                footer={
                  <div className="flex flex-col gap-2">
                    {fijos.length > 0 ? (
                      <p className="text-center text-sm text-muted-foreground">
                        Total al mes: <span className="font-bold text-foreground tabular">{formatCOP(totalFijos)}</span>
                      </p>
                    ) : null}
                    <Button size="lg" className="w-full" disabled={!fijosValid} onClick={() => go("meta")}>
                      {fijos.length ? "Siguiente" : "No tengo gastos fijos"}
                    </Button>
                    {!fijosValid ? (
                      <p className="text-center text-sm text-muted-foreground">Ponle monto a cada gasto 💕</p>
                    ) : null}
                  </div>
                }
              >
                <div className="flex flex-wrap gap-2">
                  {FIXED_SUGGESTIONS.filter((s) => !fijos.some((f) => f.nombre === s.nombre)).map((s) => (
                    <motion.button
                      key={s.nombre}
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      onClick={() => addFixed(s.nombre, s.emoji, s.categoria)}
                      className="flex h-11 items-center gap-1.5 rounded-full bg-surface px-4 text-sm font-semibold shadow-soft"
                    >
                      <span aria-hidden>{s.emoji}</span>
                      {s.nombre}
                      <Plus className="size-4 text-muted-foreground" aria-hidden />
                    </motion.button>
                  ))}
                </div>

                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    addFixed(customFixed);
                    setCustomFixed("");
                  }}
                >
                  <Input
                    value={customFixed}
                    onChange={(e) => setCustomFixed(e.target.value)}
                    placeholder="Otro (ej: cuota del celular)"
                    aria-label="Agregar otro gasto fijo"
                    maxLength={60}
                    className="h-12"
                  />
                  <Button type="submit" variant="soft" size="icon" disabled={!customFixed.trim()} aria-label="Agregar">
                    <Plus aria-hidden />
                  </Button>
                </form>

                <ul className="mt-4 flex flex-col gap-3">
                  <AnimatePresence initial={false}>
                    {fijos.map((f) => (
                      <motion.li
                        key={f.key}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="rounded-3xl bg-surface p-3 shadow-soft"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-xl" aria-hidden>
                            {f.emoji}
                          </span>
                          <span className="flex-1 font-bold">{f.nombre}</span>
                          <button
                            type="button"
                            onClick={() => setFijos((l) => l.filter((x) => x.key !== f.key))}
                            className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-expense/20"
                            aria-label={`Quitar ${f.nombre}`}
                          >
                            <X className="size-4" aria-hidden />
                          </button>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                          <MoneyInput
                            value={f.monto}
                            onValueChange={(v) => updateFixed(f.key, { monto: v })}
                            placeholder="¿Cuánto?"
                            aria-label={`Monto de ${f.nombre}`}
                            className="h-12"
                          />
                          <DaySelect
                            compact
                            label={`Día de pago de ${f.nombre}`}
                            value={f.dia_mes}
                            onChange={(d) => updateFixed(f.key, { dia_mes: d })}
                          />
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </StepLayout>
            )}

            {step === "meta" && (
              <GoalStep
                totalFijos={totalFijos}
                goal={goal}
                setGoal={setGoal}
                saving={saving}
                valid={goalValid}
                onSubmit={() => submit(goal)}
                onSkip={() => submit(null)}
              />
            )}

            {step === "listo" && (
              <DoneStep
                nombre={nombre.trim()}
                goal={goal}
                onEnter={() => {
                  router.replace("/inicio");
                  router.refresh();
                }}
              />
            )}
          </motion.section>
        </AnimatePresence>
      </div>
    </main>
  );
}

function StepLayout({
  emoji,
  title,
  subtitle,
  children,
  footer,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <motion.div
        className="text-5xl"
        initial={{ scale: 0.6, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        aria-hidden
      >
        {emoji}
      </motion.div>
      <h1 className="mt-4 font-display text-3xl font-semibold leading-tight">{title}</h1>
      <p className="mt-2 text-muted-foreground">{subtitle}</p>
      <div className="mt-6 flex-1">{children}</div>
      <div className="sticky bottom-0 -mx-5 mt-4 bg-gradient-to-t from-[#FCEFF3] via-[#FCEFF3]/95 to-transparent px-5 pb-1 pt-6">
        {footer}
      </div>
    </div>
  );
}

function DaySelect({
  label,
  value,
  onChange,
  compact = false,
}: {
  label: string;
  value: number;
  onChange: (d: number) => void;
  compact?: boolean;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", compact && "gap-0")}>
      <span className={compact ? "sr-only" : "text-sm font-semibold"}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          "h-12 rounded-2xl border border-border bg-white/80 px-4 font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15",
          !compact && "h-13",
        )}
      >
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>
            {compact ? `Día ${d}` : `Día ${d}`}
          </option>
        ))}
      </select>
    </label>
  );
}

function GoalStep({
  totalFijos,
  goal,
  setGoal,
  saving,
  valid,
  onSubmit,
  onSkip,
}: {
  totalFijos: number;
  goal: Goal | null;
  setGoal: (g: Goal | null) => void;
  saving: boolean;
  valid: boolean;
  onSubmit: () => void;
  onSkip: () => void;
}) {
  const today = todayInBogota();
  const suggestions: { label: string; goal: Goal }[] = [
    {
      label: "🛟 Fondo de emergencia",
      goal: {
        nombre: "Fondo de emergencia",
        emoji: "🛟",
        monto: totalFijos > 0 ? totalFijos * 3 : null,
        fecha: "",
        es_fondo_emergencia: true,
      },
    },
    { label: "✈️ Un viaje", goal: { nombre: "Mi próximo viaje", emoji: "✈️", monto: null, fecha: "", es_fondo_emergencia: false } },
    { label: "💻 Algo que quiero", goal: { nombre: "", emoji: "💻", monto: null, fecha: "", es_fondo_emergencia: false } },
  ];

  return (
    <StepLayout
      emoji="🌷"
      title="Siembra tu primera flor"
      subtitle="Cada meta de ahorro es una flor que crece con cada abono"
      footer={
        <div className="flex flex-col gap-2">
          <Button size="lg" className="w-full" disabled={!goal || !valid} loading={saving} onClick={onSubmit}>
            Sembrar mi flor 🌱
          </Button>
          <Button variant="ghost" className="w-full" disabled={saving} onClick={onSkip}>
            Lo hago después
          </Button>
        </div>
      }
    >
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <motion.button
            key={s.label}
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => setGoal(s.goal)}
            aria-pressed={goal?.emoji === s.goal.emoji && goal?.es_fondo_emergencia === s.goal.es_fondo_emergencia}
            className="flex h-11 items-center rounded-full bg-surface px-4 text-sm font-semibold shadow-soft"
          >
            {s.label}
          </motion.button>
        ))}
      </div>
      {totalFijos > 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Tip: un fondo de emergencia ideal son 3 meses de tus gastos fijos ({formatCOP(totalFijos * 3)}).
        </p>
      ) : null}

      <AnimatePresence>
        {goal ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5 flex flex-col gap-4 rounded-4xl bg-surface p-4 shadow-soft"
          >
            <div role="radiogroup" aria-label="Emoji de la meta" className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {GOAL_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  role="radio"
                  aria-checked={goal.emoji === e}
                  aria-label={e}
                  onClick={() => setGoal({ ...goal, emoji: e })}
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-2xl text-xl",
                    goal.emoji === e ? "bg-primary-soft shadow-[0_0_0_2px_var(--primary)]" : "bg-background",
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">¿Para qué ahorras?</span>
              <Input
                value={goal.nombre}
                onChange={(e) => setGoal({ ...goal, nombre: e.target.value })}
                placeholder="Ej: Viaje a Cartagena"
                maxLength={60}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">¿Cuánto necesitas?</span>
              <MoneyInput value={goal.monto} onValueChange={(v) => setGoal({ ...goal, monto: v })} placeholder="Ej: 1.500.000" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">
                ¿Para cuándo? <span className="font-normal text-muted-foreground">(opcional)</span>
              </span>
              <Input type="date" min={today} value={goal.fecha} onChange={(e) => setGoal({ ...goal, fecha: e.target.value })} />
            </label>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </StepLayout>
  );
}

function DoneStep({ nombre, goal, onEnter }: { nombre: string; goal: Goal | null; onEnter: () => void }) {
  useEffect(() => {
    haptic(20);
    let cancelled = false;
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      const colors = ["#D97BA6", "#F6D6E4", "#C9B6E4", "#FFD3B6", "#8FD5B6"];
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors, disableForReducedMotion: true });
      setTimeout(() => confetti({ particleCount: 60, spread: 120, origin: { y: 0.5 }, colors, disableForReducedMotion: true }), 400);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -40 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
      >
        <FlowerMark className="size-28" />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="font-display text-3xl font-semibold"
      >
        ¡Todo listo, {nombre}! 💖
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="max-w-xs text-muted-foreground"
      >
        {goal
          ? `Sembraste tu primera flor: ${goal.emoji} ${goal.nombre}. Cada abono la hará crecer 🌱`
          : "Tu jardín está listo para empezar a florecer ✨"}
      </motion.p>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-4 w-full">
        <Button size="lg" className="w-full" onClick={onEnter}>
          Entrar a mi jardín
        </Button>
      </motion.div>
    </div>
  );
}
