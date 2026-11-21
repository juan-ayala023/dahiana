import { test } from "node:test";
import assert from "node:assert/strict";
import { dailyAllowance } from "../lib/finance/daily.ts";
import { goalStage, periodsUntil, suggestedContribution } from "../lib/finance/goals.ts";
import { currentPeriod, expectedIncomeForPeriod, pendingFixedExpenses } from "../lib/finance/period.ts";

test("período quincenal 15 y 30: a mitad de la segunda quincena", () => {
  const p = currentPeriod("quincenal", [15, 30], "2026-11-21");
  assert.equal(p.start, "2026-11-15");
  assert.equal(p.nextPay, "2026-11-30");
  assert.equal(p.end, "2026-11-29");
  assert.equal(p.daysLeft, 9);
  assert.equal(p.kind, "quincena");
});

test("período quincenal: el día de pago empieza un período nuevo", () => {
  const p = currentPeriod("quincenal", [15, 30], "2026-11-30");
  assert.equal(p.start, "2026-11-30");
  assert.equal(p.nextPay, "2026-12-15");
});

test("período quincenal en febrero ajusta el 30 al 28", () => {
  const p = currentPeriod("quincenal", [15, 30], "2027-02-20");
  assert.equal(p.start, "2027-02-15");
  assert.equal(p.nextPay, "2027-02-28");
});

test("período quincenal a inicio de mes viene del mes anterior", () => {
  const p = currentPeriod("quincenal", [15, 30], "2026-12-03");
  assert.equal(p.start, "2026-11-30");
  assert.equal(p.nextPay, "2026-12-15");
  assert.equal(p.daysLeft, 12);
});

test("período mensual el día 30", () => {
  const p = currentPeriod("mensual", [30], "2026-11-21");
  assert.equal(p.start, "2026-10-30");
  assert.equal(p.nextPay, "2026-11-30");
  assert.equal(p.kind, "mes");
});

test("período variable = mes calendario", () => {
  const p = currentPeriod("variable", [1], "2026-11-21");
  assert.equal(p.start, "2026-11-01");
  assert.equal(p.end, "2026-11-30");
  assert.equal(p.nextPay, null);
  assert.equal(p.daysLeft, 10);
});

test("gastos fijos pendientes: solo los que vencen entre hoy y fin del período", () => {
  const recurring = [
    { monto: 900_000, dia_mes: 5, activo: true }, // ya pasó
    { monto: 55_000, dia_mes: 25, activo: true }, // pendiente
    { monto: 30_000, dia_mes: 21, activo: true }, // vence hoy → pendiente
    { monto: 99_000, dia_mes: 26, activo: false }, // inactivo
  ];
  assert.equal(pendingFixedExpenses(recurring, "2026-11-21", "2026-11-29"), 85_000);
});

test("gastos fijos pendientes cruzando de mes", () => {
  assert.equal(pendingFixedExpenses([{ monto: 100, dia_mes: 2, activo: true }], "2026-11-30", "2026-12-14"), 100);
});

test("ingreso esperado por período", () => {
  assert.equal(expectedIncomeForPeriod(2_500_000, "quincena"), 1_250_000);
  assert.equal(expectedIncomeForPeriod(2_500_000, "mes"), 2_500_000);
  assert.equal(expectedIncomeForPeriod(null, "mes"), 0);
});

test("hoy puedes gastar: caso normal redondeado a centenas", () => {
  const r = dailyAllowance({
    ingresos: 1_250_000,
    gastado: 300_000,
    fijosPendientes: 55_000,
    ahorroPlanificado: 100_000,
    ahorrado: 0,
    daysLeft: 9,
  });
  assert.equal(r.disponible, 795_000);
  assert.equal(r.porDia, 88_300);
  assert.equal(r.estado, "holgado");
});

test("hoy puedes gastar: el ahorro ya abonado reemplaza al planificado", () => {
  const r = dailyAllowance({ ingresos: 1_000_000, gastado: 0, fijosPendientes: 0, ahorroPlanificado: 100_000, ahorrado: 250_000, daysLeft: 10 });
  assert.equal(r.ahorroReservado, 250_000);
  assert.equal(r.disponible, 750_000);
});

test("hoy puedes gastar: negativo y sin ingresos", () => {
  assert.equal(dailyAllowance({ ingresos: 100, gastado: 500, fijosPendientes: 0, ahorroPlanificado: 0, ahorrado: 0, daysLeft: 2 }).estado, "negativo");
  assert.equal(dailyAllowance({ ingresos: 0, gastado: 0, fijosPendientes: 0, ahorroPlanificado: 0, ahorrado: 0, daysLeft: 5 }).estado, "sin-ingresos");
});

test("etapas de la flor", () => {
  assert.deepEqual([0, 24.9, 25, 50, 75, 99.9, 100].map(goalStage), [0, 0, 1, 2, 3, 3, 4]);
});

test("ahorro sugerido por quincena hasta la fecha objetivo", () => {
  assert.equal(periodsUntil("quincenal", "2026-11-21", "2027-02-21"), 7);
  const s = suggestedContribution(
    { monto_objetivo: 1_500_000, monto_actual: 100_000, fecha_objetivo: "2027-02-21", estado: "activa" },
    "quincenal",
    "2026-11-21",
  );
  assert.equal(s, 200_000);
  assert.equal(
    suggestedContribution({ monto_objetivo: 1, monto_actual: 0, fecha_objetivo: null, estado: "activa" }, "mensual", "2026-11-21"),
    null,
  );
});

import { budgetStatus, crossedThreshold, rule503020 } from "../lib/finance/budget.ts";

test("estado del límite: verde, durazno y coral", () => {
  assert.equal(budgetStatus(60_000, 100_000).level, "ok");
  assert.equal(budgetStatus(70_000, 100_000).level, "warn");
  assert.equal(budgetStatus(100_000, 100_000).level, "warn");
  assert.equal(budgetStatus(100_001, 100_000).level, "over");
  assert.equal(budgetStatus(30_000, 100_000).remaining, 70_000);
});

test("regla 50/30/20", () => {
  const rows = rule503020(2_000_000, { necesidad: 800_000, gusto: 300_000, ahorro: 100_000 });
  assert.deepEqual(
    rows.map((r) => [r.clase, r.target, Math.round(r.pct)]),
    [
      ["necesidad", 1_000_000, 80],
      ["gusto", 600_000, 50],
      ["ahorro", 400_000, 25],
    ],
  );
});

test("alerta al cruzar 80% y 100%", () => {
  assert.equal(crossedThreshold(70_000, 85_000, 100_000), 80);
  assert.equal(crossedThreshold(85_000, 90_000, 100_000), null);
  assert.equal(crossedThreshold(90_000, 120_000, 100_000), 100);
  assert.equal(crossedThreshold(50_000, 120_000, 100_000), 100);
  assert.equal(crossedThreshold(110_000, 130_000, 100_000), null);
});

import { streakStats } from "../lib/finance/streak.ts";

test("racha: viva si registró ayer aunque hoy no", () => {
  const s = streakStats(["2026-11-18", "2026-11-19", "2026-11-20"], "2026-11-21");
  assert.equal(s.current, 3);
  assert.equal(s.registeredToday, false);
});

test("racha: se corta con un día sin registro", () => {
  const s = streakStats(["2026-11-15", "2026-11-16", "2026-11-17", "2026-11-19", "2026-11-21"], "2026-11-21");
  assert.equal(s.current, 1);
  assert.equal(s.longest, 3);
  assert.equal(s.registeredToday, true);
});

test("racha: cruza de mes y sin datos", () => {
  assert.equal(streakStats(["2026-10-30", "2026-10-31", "2026-11-01"], "2026-11-01").current, 3);
  assert.deepEqual(streakStats([], "2026-11-21"), { current: 0, longest: 0, registeredToday: false });
});
