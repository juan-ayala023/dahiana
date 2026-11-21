/**
 * "¿Cuánto puedo gastar hoy?"
 *
 *   (ingresos del período − gastos fijos pendientes − ahorro planificado
 *    − gastado en el período) / días restantes del período
 *
 * El ahorro cuenta como lo que sea mayor entre lo planificado y lo que ya
 * abonó: si ya abonó, esa plata salió de su bolsillo; si no, se reserva.
 */
export type DailyInput = {
  ingresos: number;
  gastado: number;
  fijosPendientes: number;
  ahorroPlanificado: number;
  ahorrado: number;
  daysLeft: number;
};

export type DailyResult = {
  disponible: number;
  porDia: number;
  ahorroReservado: number;
  estado: "holgado" | "justo" | "negativo" | "sin-ingresos";
};

/** Redondea hacia abajo a centenas (los pesos sueltos no ayudan a decidir). */
const floorToHundred = (n: number) => Math.floor(n / 100) * 100;

export function dailyAllowance(input: DailyInput): DailyResult {
  const ahorroReservado = Math.max(input.ahorroPlanificado, input.ahorrado);
  const disponible = input.ingresos - input.gastado - input.fijosPendientes - ahorroReservado;
  const days = Math.max(1, input.daysLeft);
  const porDia = disponible > 0 ? floorToHundred(disponible / days) : Math.ceil(disponible / days);

  let estado: DailyResult["estado"];
  if (input.ingresos <= 0) estado = "sin-ingresos";
  else if (disponible < 0) estado = "negativo";
  else if (disponible < input.ingresos * 0.1) estado = "justo";
  else estado = "holgado";

  return { disponible, porDia, ahorroReservado, estado };
}
