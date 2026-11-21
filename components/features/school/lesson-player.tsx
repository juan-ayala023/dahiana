"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { announceAchievements } from "@/components/features/achievements/announce";
import { saveLessonProgress } from "@/lib/actions/lessons";
import type { Lesson } from "@/lib/content/lessons";
import { cn, haptic } from "@/lib/utils";

type Phase = { kind: "story"; index: number } | { kind: "quiz"; index: number } | { kind: "result" };

type Props = { lesson: Lesson; next: { slug: string; title: string } | null; bestScore: number | null };

const COLORS = ["#D97BA6", "#F6D6E4", "#C9B6E4", "#FFD3B6", "#8FD5B6"];

export function LessonPlayer({ lesson, next, bestScore }: Props) {
  const [phase, setPhase] = useState<Phase>({ kind: "story", index: 0 });
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  const [saving, startSaving] = useTransition();
  const total = lesson.slides.length;

  const goStory = useCallback(
    (index: number) => {
      if (index < 0) return;
      setDirection(index > (phase.kind === "story" ? phase.index : 0) ? 1 : -1);
      if (index >= total) setPhase({ kind: "quiz", index: 0 });
      else setPhase({ kind: "story", index });
      haptic(4);
    },
    [phase, total],
  );

  // Teclado: flechas para avanzar o retroceder en las historias.
  useEffect(() => {
    if (phase.kind !== "story") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goStory(phase.index + 1);
      if (e.key === "ArrowLeft") goStory(phase.index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, goStory]);

  const score = answers.reduce<number>((s, a, i) => s + (a === lesson.quiz[i]!.correct ? 1 : 0), 0);

  const finish = () => {
    setPhase({ kind: "result" });
    startSaving(async () => {
      const res = await saveLessonProgress(lesson.slug, score);
      if (!res.ok) toast.error(res.error);
      else announceAchievements(res.unlocked);
    });
    if (score === 3) {
      haptic(25);
      import("canvas-confetti").then(({ default: confetti }) =>
        confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 }, colors: COLORS, disableForReducedMotion: true, zIndex: 80 }),
      );
    }
  };

  const restart = () => {
    setAnswers([null, null, null]);
    setDirection(-1);
    setPhase({ kind: "story", index: 0 });
  };

  const bg = `linear-gradient(160deg, ${lesson.colors[0]} 0%, ${lesson.colors[1]} 100%)`;

  return (
    <main
      className="light-scope relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]"
      style={{ backgroundImage: bg }}
    >
      {/* Barra superior: progreso + cerrar */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1" aria-hidden>
          {lesson.slides.map((_, i) => (
            <span key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/50">
              <motion.span
                className="block h-full rounded-full bg-foreground/70"
                initial={false}
                animate={{ width: phase.kind !== "story" || i <= phase.index ? "100%" : "0%" }}
                transition={{ duration: 0.3 }}
              />
            </span>
          ))}
          <span className="h-1.5 w-6 overflow-hidden rounded-full bg-white/50">
            <motion.span
              className="block h-full rounded-full bg-primary-deep"
              initial={false}
              animate={{ width: phase.kind === "story" ? "0%" : "100%" }}
            />
          </span>
        </div>
        <Link
          href="/escuelita"
          className="flex size-11 items-center justify-center rounded-full bg-white/60 active:scale-95"
          aria-label="Salir de la lección"
        >
          <X className="size-5" aria-hidden />
        </Link>
      </div>

      <p className="mt-3 text-sm font-bold text-foreground/70">
        {lesson.emoji} Lección {lesson.order} · {lesson.title}
      </p>

      <div className="relative flex flex-1 flex-col">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          {phase.kind === "story" && (
            <motion.section
              key={`s-${phase.index}`}
              custom={direction}
              initial={{ opacity: 0, x: direction * 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -50 }}
              transition={{ duration: 0.25 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_: unknown, info: PanInfo) => {
                if (info.offset.x < -60) goStory(phase.index + 1);
                else if (info.offset.x > 60) goStory(phase.index - 1);
              }}
              className="relative flex flex-1 flex-col justify-center py-6"
              aria-live="polite"
              aria-label={`Historia ${phase.index + 1} de ${total}`}
            >
              {/* Zonas táctiles: izquierda retrocede, derecha avanza */}
              <button
                type="button"
                className="absolute inset-y-0 left-0 z-10 w-1/3"
                onClick={() => goStory(phase.index - 1)}
                aria-label="Historia anterior"
                tabIndex={-1}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 z-10 w-2/3"
                onClick={() => goStory(phase.index + 1)}
                aria-label="Siguiente historia"
                tabIndex={-1}
              />
              <motion.div
                initial={{ scale: 0.6, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 14 }}
                className="text-7xl"
                aria-hidden
              >
                {lesson.slides[phase.index]!.emoji}
              </motion.div>
              <h1 className="mt-6 font-display text-3xl font-semibold leading-tight">{lesson.slides[phase.index]!.title}</h1>
              <p className="mt-4 text-lg leading-relaxed text-foreground/90">{lesson.slides[phase.index]!.body}</p>
            </motion.section>
          )}

          {phase.kind === "quiz" && (
            <QuizCard
              key={`q-${phase.index}`}
              index={phase.index}
              question={lesson.quiz[phase.index]!}
              answer={answers[phase.index] ?? null}
              onAnswer={(opt) => {
                setAnswers((a) => a.map((v, i) => (i === phase.index ? opt : v)));
                haptic(opt === lesson.quiz[phase.index]!.correct ? 12 : 40);
              }}
            />
          )}

          {phase.kind === "result" && (
            <motion.section
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center"
            >
              <motion.span
                className="text-7xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 10 }}
                aria-hidden
              >
                {score === 3 ? "🏆" : score === 2 ? "🌟" : "🌱"}
              </motion.span>
              <h1 className="font-display text-3xl font-semibold">
                {score === 3 ? "¡Perfecta!" : score === 2 ? "¡Muy bien!" : "¡Buen intento!"}
              </h1>
              <p className="text-lg">
                Acertaste <strong>{score} de 3</strong>
                {bestScore !== null && bestScore > score ? ` · tu mejor puntaje sigue siendo ${bestScore}/3` : ""}
              </p>
              <p className="max-w-xs text-foreground/80">
                {score === 3
                  ? "Dominas este tema. ¡Tu yo del futuro te lo agradece! 💖"
                  : "Cada lección te hace más fuerte con tu plata. Puedes repasarla cuando quieras ✨"}
              </p>
              <div className="mt-6 flex w-full flex-col gap-2">
                {next ? (
                  <Link
                    href={`/leccion/${next.slug}`}
                    className="flex h-14 items-center justify-center gap-1 rounded-full bg-brand px-6 text-lg font-semibold text-on-brand shadow-glow active:scale-[0.98]"
                  >
                    Siguiente: {next.title} <ChevronRight className="size-5" aria-hidden />
                  </Link>
                ) : null}
                <Button variant={next ? "outline" : "primary"} size="lg" className="w-full" onClick={restart} disabled={saving}>
                  Repasar la lección
                </Button>
                <Link href="/escuelita" className="flex min-h-11 items-center justify-center font-semibold text-primary-deep">
                  Volver a la Escuelita
                </Link>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* Navegación inferior */}
      {phase.kind === "story" ? (
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => goStory(phase.index - 1)}
            disabled={phase.index === 0}
            aria-label="Anterior"
          >
            <ChevronLeft aria-hidden />
          </Button>
          <Button size="lg" className="flex-1" onClick={() => goStory(phase.index + 1)}>
            {phase.index === total - 1 ? "¡A practicar! 🧠" : "Siguiente"}
          </Button>
        </div>
      ) : phase.kind === "quiz" ? (
        <Button
          size="lg"
          className="w-full"
          disabled={answers[phase.index] === null}
          onClick={() => (phase.index < 2 ? setPhase({ kind: "quiz", index: phase.index + 1 }) : finish())}
        >
          {phase.index < 2 ? "Siguiente pregunta" : "Ver resultado"}
        </Button>
      ) : null}
    </main>
  );
}

function QuizCard({
  index,
  question,
  answer,
  onAnswer,
}: {
  index: number;
  question: Lesson["quiz"][number];
  answer: number | null;
  onAnswer: (opt: number) => void;
}) {
  const answered = answer !== null;
  return (
    <motion.section
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.25 }}
      className="flex flex-1 flex-col justify-center gap-4 py-6"
    >
      <p className="text-sm font-bold uppercase tracking-wider text-primary-deep">Pregunta {index + 1} de 3</p>
      <h1 className="font-display text-2xl font-semibold leading-snug">{question.question}</h1>
      <div role="radiogroup" aria-label="Opciones" className="flex flex-col gap-2">
        {question.options.map((opt, i) => {
          const isCorrect = i === question.correct;
          const isChosen = i === answer;
          return (
            <motion.button
              key={opt}
              type="button"
              role="radio"
              aria-checked={isChosen}
              disabled={answered}
              onClick={() => onAnswer(i)}
              whileTap={answered ? undefined : { scale: 0.97 }}
              animate={answered && isChosen && !isCorrect ? { x: [0, -8, 8, -4, 0] } : {}}
              className={cn(
                "flex min-h-14 items-center gap-3 rounded-3xl px-4 py-3 text-left font-semibold transition-colors",
                !answered && "bg-white/80 shadow-soft",
                answered && isCorrect && "bg-income/60 text-[#1F5A40]",
                answered && isChosen && !isCorrect && "bg-expense/60 text-[#6B1F2E]",
                answered && !isCorrect && !isChosen && "bg-white/50 text-foreground/60",
              )}
            >
              <span className="flex-1">{opt}</span>
              {answered && isCorrect ? <Check className="size-5 shrink-0" aria-label="Correcta" /> : null}
              {answered && isChosen && !isCorrect ? <X className="size-5 shrink-0" aria-label="Incorrecta" /> : null}
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence>
        {answered ? (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-white/70 p-4 text-sm font-medium"
            role="status"
          >
            {answer === question.correct ? "¡Correcto! " : "Casi. "}
            {question.explanation}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}
