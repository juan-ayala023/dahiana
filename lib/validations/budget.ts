import { z } from "zod";

const monto = z.number().int("Usa pesos enteros").positive("Escribe un monto").max(1_000_000_000_000);
export const firstOfMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-01$/, "Mes inválido");

export const budgetSchema = z.object({
  category_id: z.string().uuid(),
  mes: firstOfMonth,
  limite: monto.nullable(),
});

export const recurringSchema = z.object({
  nombre: z.string().trim().min(1, "Ponle un nombre").max(60, "Máximo 60 caracteres"),
  monto,
  dia_mes: z.number().int().min(1).max(31),
  category_id: z.string().uuid().nullable(),
  activo: z.boolean(),
});

export type RecurringInput = z.input<typeof recurringSchema>;
