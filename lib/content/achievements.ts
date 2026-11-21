/** Catálogo de logros. El código es lo que se guarda en la tabla achievements. */
export const ACHIEVEMENTS = {
  primer_registro: { emoji: "🌱", titulo: "Primera semilla", descripcion: "Registraste tu primer movimiento" },
  racha_7: { emoji: "🔥", titulo: "Una semana constante", descripcion: "7 días seguidos registrando" },
  primer_abono: { emoji: "💧", titulo: "Primer riego", descripcion: "Hiciste tu primer abono a una meta" },
  primera_meta: { emoji: "🌸", titulo: "Primera flor", descripcion: "Cumpliste tu primera meta de ahorro" },
  fondo_50: { emoji: "🛟", titulo: "Red de seguridad", descripcion: "Tu fondo de emergencia va por la mitad" },
  mes_en_presupuesto: { emoji: "👑", titulo: "Reina del presupuesto", descripcion: "Un mes completo sin pasarte" },
  primera_leccion: { emoji: "🎓", titulo: "Alumna estrella", descripcion: "Completaste tu primera lección" },
} as const;

export type AchievementCode = keyof typeof ACHIEVEMENTS;
