/** Tips del día: rotan uno por día del año. */
export const TIPS: { emoji: string; text: string }[] = [
  { emoji: "🌱", text: "Anotar cada gasto, por pequeño que sea, es el primer paso para entender tu plata." },
  { emoji: "🐷", text: "Págate primero: apenas te paguen, aparta tu ahorro antes de gastar." },
  { emoji: "☕", text: "Un tintico diario de $4.000 son $120.000 al mes. Los gastos hormiga suman." },
  { emoji: "🛟", text: "Tu fondo de emergencia ideal cubre 3 meses de gastos fijos. Empieza con poquito." },
  { emoji: "🛒", text: "Ve al mercado con lista y sin hambre: gastarás menos en antojos." },
  { emoji: "⏳", text: "Antes de una compra grande, espera 48 horas. Si aún la quieres, es real." },
  { emoji: "💳", text: "Con la tarjeta de crédito, paga el total cada mes para no pagar intereses." },
  { emoji: "📅", text: "Revisa tus suscripciones: ¿todavía usas todas las que pagas?" },
  { emoji: "🎯", text: "Una meta con nombre y fecha se cumple más fácil que \"ahorrar algo\"." },
  { emoji: "🧾", text: "El 4x1000 aplica a retiros y transferencias; tener una cuenta exenta te ahorra plata." },
  { emoji: "🌸", text: "Darte gusticos está bien. La clave es que quepan en tu presupuesto." },
  { emoji: "📊", text: "Regla 50/30/20: 50% necesidades, 30% gustos y 20% ahorro. Es una guía, no una ley." },
  { emoji: "🚕", text: "Suma lo que gastas en transporte en la semana; a veces un plan mensual sale mejor." },
  { emoji: "🎁", text: "Abre un \"bolsillo\" para regalos y fechas especiales; diciembre no te tomará por sorpresa." },
  { emoji: "🧠", text: "Cuando estés triste o aburrida, evita las apps de compras. Las emociones también gastan." },
  { emoji: "💧", text: "El interés compuesto es como regar una planta: poquito pero constante hace magia." },
  { emoji: "🔁", text: "Automatiza tu ahorro: una transferencia programada el día de pago es tu mejor aliada." },
  { emoji: "🧺", text: "Comparar precios por kilo o por unidad en el súper te ayuda a elegir mejor." },
  { emoji: "📵", text: "Desactiva las notificaciones de tiendas online; menos tentaciones, más tranquilidad." },
  { emoji: "🍱", text: "Llevar almuerzo dos veces por semana puede ahorrarte más de $100.000 al mes." },
  { emoji: "🏦", text: "Un CDT o una cuenta de alto rendimiento hace que tus ahorros crezcan solos." },
  { emoji: "✍️", text: "Revisa tus movimientos cada domingo: 5 minutos que valen oro." },
  { emoji: "🌙", text: "Si una compra no te deja dormir tranquila, probablemente no es buena idea." },
  { emoji: "🪴", text: "Celebra cada abono a tu meta: tu flor crece y tú también." },
  { emoji: "🧮", text: "Si tus ingresos varían, presupuesta con el mes más bajo y ahorra la diferencia." },
  { emoji: "🔒", text: "Nunca compartas tus claves ni códigos del banco, ni siquiera con \"el banco\" por llamada." },
  { emoji: "👛", text: "Saca el efectivo de la semana y cuando se acabe, se acabó. Funciona para los antojos." },
  { emoji: "📈", text: "Ganar más ayuda, pero gastar consciente es lo que realmente te hace avanzar." },
  { emoji: "🤝", text: "Hablar de plata con quien quieres no es incómodo: es construir juntos." },
  { emoji: "💖", text: "No se trata de ser perfecta, sino constante. Cada día que anotas cuenta." },
];

export function tipOfTheDay(today: string): { emoji: string; text: string } {
  const [y, m, d] = today.split("-").map(Number) as [number, number, number];
  const dayOfYear = Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86_400_000);
  return TIPS[dayOfYear % TIPS.length]!;
}
