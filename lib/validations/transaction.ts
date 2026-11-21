import { z } from "zod";
import { isDateKey } from "@/lib/finance/dates";

export const MAX_MONTO = 1_000_000_000_000;

export const transactionSchema = z.object({
  id: z.string().uuid(),
  tipo: z.enum(["gasto", "ingreso"]),
  monto: z.number().int("El monto debe ser en pesos enteros").positive("Escribe un monto").max(MAX_MONTO),
  category_id: z.string().uuid("Elige una categoría"),
  nota: z
    .string()
    .trim()
    .max(200, "La nota es muy larga")
    .nullable()
    .transform((v) => (v ? v : null)),
  fecha: z.string().refine(isDateKey, "Fecha inválida"),
});

export type TransactionInput = z.input<typeof transactionSchema>;

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Aviso de presupuesto que devuelve el registro de un gasto. */
export type BudgetAlert = { level: 80 | 100; categoria: string; emoji: string; restante: number };

export type TransactionResult = { ok: true; alert?: BudgetAlert; unlocked?: string[] } | { ok: false; error: string };
