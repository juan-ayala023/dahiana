import { z } from "zod";
import { isDateKey } from "@/lib/finance/dates";

const monto = z.number().int().positive().max(1_000_000_000_000);
const dia = z.number().int().min(1).max(31);

export const onboardingSchema = z
  .object({
    nombre: z.string().trim().min(1, "¿Cómo te llamas?").max(40),
    avatar_emoji: z.string().min(1).max(16),
    frecuencia_pago: z.enum(["quincenal", "mensual", "variable"]),
    dias_pago: z.array(dia).min(1).max(2),
    ingreso_estimado: monto.nullable(),
    gastos_fijos: z
      .array(
        z.object({
          nombre: z.string().trim().min(1).max(60),
          monto,
          dia_mes: dia,
          categoria: z.string().trim().max(40).nullable(),
        }),
      )
      .max(20),
    meta: z
      .object({
        nombre: z.string().trim().min(1, "Ponle un nombre a tu meta").max(60),
        emoji: z.string().min(1).max(16),
        monto_objetivo: monto,
        fecha_objetivo: z.string().refine(isDateKey).nullable(),
        es_fondo_emergencia: z.boolean(),
      })
      .nullable(),
  })
  .refine((d) => d.frecuencia_pago !== "quincenal" || d.dias_pago.length === 2, {
    path: ["dias_pago"],
    message: "Elige tus dos días de pago",
  });

export type OnboardingInput = z.input<typeof onboardingSchema>;
