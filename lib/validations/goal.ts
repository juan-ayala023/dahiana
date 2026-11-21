import { z } from "zod";
import { isDateKey } from "@/lib/finance/dates";

const monto = z.number().int("Usa pesos enteros").positive("Escribe un monto").max(1_000_000_000_000);

export const GOAL_COLORS = ["#D97BA6", "#C9B6E4", "#FF9AA8", "#FFB98A", "#8FD5B6", "#8EC5E8"] as const;

export const goalSchema = z.object({
  nombre: z.string().trim().min(1, "Ponle un nombre a tu meta").max(60, "Máximo 60 caracteres"),
  emoji: z.string().min(1).max(16),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  monto_objetivo: monto,
  fecha_objetivo: z
    .string()
    .nullable()
    .refine((v) => v === null || isDateKey(v), "Fecha inválida"),
  es_fondo_emergencia: z.boolean(),
});

export type GoalInput = z.input<typeof goalSchema>;

export const contributionSchema = z.object({
  goal_id: z.string().uuid(),
  monto,
  nota: z
    .string()
    .trim()
    .max(200)
    .nullable()
    .transform((v) => (v ? v : null)),
  fecha: z.string().refine(isDateKey, "Fecha inválida"),
});

export type ContributionInput = z.input<typeof contributionSchema>;
