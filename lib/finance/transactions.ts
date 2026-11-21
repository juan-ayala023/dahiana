import type { Transaction } from "@/types/database";

/**
 * Operaciones optimistas sobre la lista de movimientos. Se aplican encima de lo
 * que trae el servidor hasta que la Server Action termina y la página se revalida.
 */
export type PendingOp =
  | { type: "add"; tx: Transaction }
  | { type: "update"; tx: Transaction }
  | { type: "delete"; id: string };

/** Orden: fecha más reciente primero; dentro del día, lo último registrado arriba. */
export function sortTransactions(list: Transaction[]): Transaction[] {
  return [...list].sort((a, b) =>
    a.fecha === b.fecha ? b.created_at.localeCompare(a.created_at) : b.fecha.localeCompare(a.fecha),
  );
}

export function applyPendingOps(list: Transaction[], ops: PendingOp[]): Transaction[] {
  if (ops.length === 0) return list;
  let out = list;
  for (const op of ops) {
    if (op.type === "add") {
      if (!out.some((t) => t.id === op.tx.id)) out = [op.tx, ...out];
    } else if (op.type === "update") {
      out = out.map((t) => (t.id === op.tx.id ? op.tx : t));
    } else {
      out = out.filter((t) => t.id !== op.id);
    }
  }
  return sortTransactions(out);
}

export type DayGroup = { fecha: string; items: Transaction[]; ingresos: number; gastos: number };

/** Agrupa por día manteniendo el orden (la lista ya debe venir ordenada). */
export function groupByDay(list: Transaction[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const tx of list) {
    let group = groups.at(-1);
    if (!group || group.fecha !== tx.fecha) {
      group = { fecha: tx.fecha, items: [], ingresos: 0, gastos: 0 };
      groups.push(group);
    }
    group.items.push(tx);
    if (tx.tipo === "ingreso") group.ingresos += tx.monto;
    else group.gastos += tx.monto;
  }
  return groups;
}

export function totals(list: Transaction[]): { ingresos: number; gastos: number; balance: number } {
  let ingresos = 0;
  let gastos = 0;
  for (const tx of list) {
    if (tx.tipo === "ingreso") ingresos += tx.monto;
    else gastos += tx.monto;
  }
  return { ingresos, gastos, balance: ingresos - gastos };
}

/** Quita tildes y pasa a minúsculas para buscar sin importar acentos. */
export function normalizeText(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}
