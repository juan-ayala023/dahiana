/** Catálogo de logros. El código es lo que se guarda en la tabla achievements. */
export const ACHIEVEMENTS = {
  primer_registro: { emoji: "🌱", titulo: "Primera semilla", descripcion: "Registraste tu primer movimiento" },
  racha_7: { emoji: "🔥", titulo: "Una semana constante", descripcion: "7 días seguidos registrando" },
  racha_30: { emoji: "🌟", titulo: "Un mes imparable", descripcion: "30 días seguidos registrando" },
  primer_abono: { emoji: "💧", titulo: "Primer riego", descripcion: "Hiciste tu primer abono a una meta" },
  primera_meta: { emoji: "🌸", titulo: "Primera flor", descripcion: "Cumpliste tu primera meta de ahorro" },
  fondo_50: { emoji: "🛟", titulo: "Red de seguridad", descripcion: "Tu fondo de emergencia va por la mitad" },
  mes_en_presupuesto: { emoji: "👑", titulo: "Reina del presupuesto", descripcion: "Un mes completo sin pasarte de tus límites" },
  primera_leccion: { emoji: "🎓", titulo: "Alumna estrella", descripcion: "Completaste tu primera lección" },
  escuelita_completa: { emoji: "📜", titulo: "Graduada", descripcion: "Completaste las 8 lecciones de la Escuelita" },
} as const;

export type AchievementCode = keyof typeof ACHIEVEMENTS;

export const ACHIEVEMENT_CODES = Object.keys(ACHIEVEMENTS) as AchievementCode[];
