import { z } from "zod";

const dia = z.number().int().min(1).max(31);

export const profileSchema = z
  .object({
    nombre: z.string().trim().min(1, "¿Cómo te llamas?").max(40),
    avatar_emoji: z.string().min(1).max(16),
    frecuencia_pago: z.enum(["quincenal", "mensual", "variable"]),
    dias_pago: z.array(dia).min(1).max(2),
    ingreso_estimado: z.number().int().positive().max(1_000_000_000_000).nullable(),
  })
  .refine((d) => d.frecuencia_pago !== "quincenal" || d.dias_pago.length === 2, {
    path: ["dias_pago"],
    message: "Elige tus dos días de pago",
  });

export type ProfileInput = z.input<typeof profileSchema>;

export const categorySchema = z
  .object({
    nombre: z.string().trim().min(1, "Ponle un nombre").max(40, "Máximo 40 caracteres"),
    emoji: z.string().trim().min(1, "Elige un emoji").max(16),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    tipo: z.enum(["gasto", "ingreso"]),
    clasificacion: z.enum(["necesidad", "gusto", "ahorro"]).nullable(),
  })
  .transform((c) => ({ ...c, clasificacion: c.tipo === "gasto" ? (c.clasificacion ?? "gusto") : null }));

export type CategoryInput = z.input<typeof categorySchema>;
