import type { Metadata } from "next";
import Link from "next/link";
import { Check, ChevronRight, Trophy } from "lucide-react";
import { LESSONS } from "@/lib/content/lessons";
import { getLessonProgress } from "@/lib/data/queries";

export const metadata: Metadata = { title: "Escuelita financiera" };

export default async function EscuelitaPage() {
  const progress = await getLessonProgress();
  const done = LESSONS.filter((l) => l.slug in progress).length;
  const next = LESSONS.find((l) => !(l.slug in progress));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Escuelita 🎓</h1>
          <p className="mt-1 text-muted-foreground">Microlecciones de 3 minutos para manejar tu plata como una experta</p>
        </div>
        <Link
          href="/logros"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface shadow-soft active:scale-95"
          aria-label="Ver mis logros"
        >
          <Trophy className="size-5 text-primary-deep" aria-hidden />
        </Link>
      </header>

      <section className="rounded-4xl bg-hero p-5 shadow-soft" aria-label="Tu progreso">
        <p className="text-sm font-bold uppercase tracking-wider text-primary-deep">Tu progreso</p>
        <p className="mt-1 font-display text-2xl font-semibold">
          {done} de {LESSONS.length} lecciones {done === LESSONS.length ? "🎉" : ""}
        </p>
        <div
          className="mt-3 h-3 overflow-hidden rounded-full bg-white/70"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={LESSONS.length}
          aria-valuenow={done}
          aria-label="Lecciones completadas"
        >
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.max(3, (done / LESSONS.length) * 100)}%` }} />
        </div>
        {next ? (
          <Link
            href={`/leccion/${next.slug}`}
            className="mt-4 flex items-center gap-3 rounded-3xl bg-white/70 p-3 active:scale-[0.98]"
          >
            <span className="text-3xl" aria-hidden>
              {next.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-primary-deep">Sigue con</span>
              <span className="block truncate font-bold">{next.title}</span>
            </span>
            <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
          </Link>
        ) : (
          <p className="mt-3 font-medium">¡Te graduaste de la Escuelita! Puedes repasar cuando quieras 📜</p>
        )}
      </section>

      <ol className="flex flex-col gap-3">
        {LESSONS.map((l) => {
          const score = progress[l.slug];
          const completed = score !== undefined;
          return (
            <li key={l.slug}>
              <Link
                href={`/leccion/${l.slug}`}
                className="flex items-center gap-4 rounded-4xl bg-surface p-4 shadow-soft transition-transform active:scale-[0.98]"
              >
                <span
                  className="flex size-14 shrink-0 items-center justify-center rounded-3xl text-3xl"
                  style={{ backgroundImage: `linear-gradient(135deg, ${l.colors[0]}, ${l.colors[1]})` }}
                  aria-hidden
                >
                  {l.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-muted-foreground">
                    Lección {l.order} · {l.minutes} min
                  </span>
                  <span className="block font-bold leading-tight">{l.title}</span>
                  <span className="block truncate text-sm text-muted-foreground">{l.subtitle}</span>
                </span>
                {completed ? (
                  <span className="flex shrink-0 flex-col items-center gap-0.5">
                    <span className="flex size-8 items-center justify-center rounded-full bg-income/40">
                      <Check className="size-4 text-income-strong" aria-hidden />
                    </span>
                    <span className="text-[11px] font-bold text-income-strong">{score}/3</span>
                    <span className="sr-only">Completada con {score} de 3</span>
                  </span>
                ) : (
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
