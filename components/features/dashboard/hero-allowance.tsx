"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/components/features/transactions/transactions-provider";
import type { DailyResult } from "@/lib/finance/daily";
import { shortDate } from "@/lib/finance/dates";
import { formatCOP } from "@/lib/finance/format";
import type { Period } from "@/lib/finance/period";

type HeroAllowanceProps = {
  result: DailyResult;
  period: Period;
  breakdown: {
    ingresos: number;
    ingresosEstimados: boolean;
    gastado: number;
    fijosPendientes: number;
  };
};

const MESSAGES: Record<DailyResult["estado"], (porDia: number) => string> = {
  holgado: () => "Vas divina ✨ Disfruta con calma",
  justo: () => "Vas bien, pero con cuidadito 🌷",
  negativo: () => "Este período se apretó un poquito 🫶 Tranqui: hasta tu próximo pago, solo lo esencial",
  "sin-ingresos": () => "Registra tu ingreso de este período para calcularlo ✨",
};

export function HeroAllowance({ result, period, breakdown }: HeroAllowanceProps) {
  const [open, setOpen] = useState(false);
  const { openNew } = useTransactions();
  const shown = Math.max(0, result.porDia);

  const periodText = period.nextPay
    ? `${period.daysLeft === 1 ? "Mañana" : `En ${period.daysLeft} días`} es tu próximo pago (${shortDate(period.nextPay)})`
    : `Quedan ${period.daysLeft} ${period.daysLeft === 1 ? "día" : "días"} del mes`;

  return (
    <section
      aria-labelledby="hoy-puedes"
      className="relative overflow-hidden rounded-4xl bg-hero p-6 shadow-soft"
    >
      <motion.div
        className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/40 blur-2xl"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />
      <h2 id="hoy-puedes" className="relative text-sm font-bold uppercase tracking-wider text-primary-deep">
        Hoy puedes gastar
      </h2>
      <p className="relative mt-1 font-display text-5xl font-semibold tabular text-foreground">
        <AnimatedNumber value={shown} />
      </p>
      <p className="relative mt-2 text-foreground/80">{MESSAGES[result.estado](result.porDia)}</p>

      {result.estado === "sin-ingresos" ? (
        <Button size="sm" variant="outline" className="relative mt-4" onClick={() => openNew("ingreso")}>
          Registrar ingreso 💸
        </Button>
      ) : null}

      <div className="relative mt-4 flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>{periodText}</span>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="relative mt-3 flex min-h-11 items-center gap-1 text-sm font-bold text-primary-deep"
      >
        ¿Cómo lo calculo?
        <motion.span animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown className="size-4" aria-hidden />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.dl
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative overflow-hidden text-sm"
          >
            <div className="mt-1 flex flex-col gap-1.5 rounded-3xl bg-white/60 p-4 tabular">
              <Row
                label={`Ingresos de tu ${period.kind}${breakdown.ingresosEstimados ? " (estimado)" : ""}`}
                value={formatCOP(breakdown.ingresos)}
              />
              <Row label="Ya gastado" value={`− ${formatCOP(breakdown.gastado)}`} />
              <Row label="Gastos fijos por pagar" value={`− ${formatCOP(breakdown.fijosPendientes)}`} />
              <Row label="Ahorro para tus metas" value={`− ${formatCOP(result.ahorroReservado)}`} />
              <div className="my-1 h-px bg-border" />
              <Row label="Te queda" value={formatCOP(result.disponible)} strong />
              <Row label={`Entre ${period.daysLeft} ${period.daysLeft === 1 ? "día" : "días"}`} value={`${formatCOP(Math.max(0, result.porDia))} / día`} />
            </div>
          </motion.dl>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={strong ? "font-bold" : "text-muted-foreground"}>{label}</dt>
      <dd className={strong ? "font-display text-base font-semibold" : "font-semibold"}>{value}</dd>
    </div>
  );
}
