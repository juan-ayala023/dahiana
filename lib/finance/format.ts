import { LOCALE, TIME_ZONE } from "@/lib/config";

const copFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

const plainFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

/** 125000 → "$ 125.000" */
export function formatCOP(value: number): string {
  return copFormatter.format(Math.round(value));
}

/** 125000 → "125.000" (sin símbolo, útil para el teclado numérico). */
export function formatNumber(value: number): string {
  return plainFormatter.format(Math.round(value));
}

/** Fecha de hoy en Colombia como "YYYY-MM-DD" (independiente de la zona del dispositivo). */
export function todayInBogota(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Hora actual (0–23) en Colombia. */
export function hourInBogota(now: Date = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    hourCycle: "h23",
  }).format(now);
  return Number(hour);
}

/** Saludo según la hora en Colombia. */
export function greetingFor(hour: number): { text: string; emoji: string } {
  if (hour >= 5 && hour < 12) return { text: "Buenos días", emoji: "☀️" };
  if (hour >= 12 && hour < 19) return { text: "Buenas tardes", emoji: "🌷" };
  return { text: "Buenas noches", emoji: "🌙" };
}
