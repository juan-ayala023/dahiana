/** Suma días a "YYYY-MM-DD" en UTC (sin depender de la zona del dispositivo). */
function addDaysKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/**
 * Racha de días registrando, a partir de las fechas (YYYY-MM-DD) con algún movimiento.
 * La racha actual sigue viva si hoy aún no ha registrado pero ayer sí.
 */
export function streakStats(dates: Iterable<string>, today: string): { current: number; longest: number; registeredToday: boolean } {
  const set = new Set(dates);
  const registeredToday = set.has(today);

  let current = 0;
  let cursor = registeredToday ? today : addDaysKey(today, -1);
  while (set.has(cursor)) {
    current += 1;
    cursor = addDaysKey(cursor, -1);
  }

  const sorted = [...set].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev !== null && addDaysKey(prev, 1) === d ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }

  return { current, longest: Math.max(longest, current), registeredToday };
}
