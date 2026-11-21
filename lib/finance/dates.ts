import { addDays, addMonths, differenceInCalendarDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { todayInBogota } from "./format";

/**
 * Utilidades de fechas puras. Las fechas de negocio son strings "YYYY-MM-DD"
 * (día calendario en Colombia) y los meses "YYYY-MM".
 */

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export const isMonthKey = (v: unknown): v is string => typeof v === "string" && MONTH_RE.test(v);
export const isDateKey = (v: unknown): v is string => typeof v === "string" && DATE_RE.test(v);

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function currentMonthKey(today: string = todayInBogota()): string {
  return today.slice(0, 7);
}

/** Devuelve un mes válido o el mes actual. */
export function parseMonthKey(value: string | null | undefined, today?: string): string {
  return isMonthKey(value) ? value : currentMonthKey(today);
}

/** Rango [inicio, fin) del mes: { start: "2026-11-01", end: "2026-12-01" }. */
export function monthBounds(monthKey: string): { start: string; end: string } {
  const start = `${monthKey}-01`;
  const end = format(addMonths(parseISO(start), 1), "yyyy-MM-dd");
  return { start, end };
}

export function shiftMonth(monthKey: string, delta: number): string {
  return format(addMonths(parseISO(`${monthKey}-01`), delta), "yyyy-MM");
}

/** "2026-11" → "Noviembre 2026" */
export function monthLabel(monthKey: string): string {
  return capitalize(format(parseISO(`${monthKey}-01`), "MMMM yyyy", { locale: es }));
}

export function addDaysKey(dateKey: string, days: number): string {
  return format(addDays(parseISO(dateKey), days), "yyyy-MM-dd");
}

/** "Hoy", "Ayer" o "Martes 18 de noviembre". */
export function dayLabel(dateKey: string, today: string = todayInBogota()): string {
  const diff = differenceInCalendarDays(parseISO(today), parseISO(dateKey));
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  const sameYear = dateKey.slice(0, 4) === today.slice(0, 4);
  return capitalize(
    format(parseISO(dateKey), sameYear ? "EEEE d 'de' MMMM" : "EEEE d 'de' MMMM yyyy", { locale: es }),
  );
}

/** "18 nov" — etiqueta corta para chips. */
export function shortDate(dateKey: string): string {
  return format(parseISO(dateKey), "d MMM", { locale: es }).replace(".", "");
}
