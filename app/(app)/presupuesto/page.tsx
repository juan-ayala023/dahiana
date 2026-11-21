import type { Metadata } from "next";
import { BudgetView } from "@/components/features/budget/budget-view";
import { getBudgetData, getSession } from "@/lib/data/queries";
import { currentMonthKey, parseMonthKey, shiftMonth } from "@/lib/finance/dates";

export const metadata: Metadata = { title: "Presupuesto" };

type Props = { searchParams: Promise<{ mes?: string }> };

export default async function PresupuestoPage({ searchParams }: Props) {
  const { mes } = await searchParams;
  const monthKey = parseMonthKey(mes);
  const [{ profile }, data] = await Promise.all([getSession(), getBudgetData(monthKey, shiftMonth(monthKey, -1))]);

  return (
    <BudgetView
      key={monthKey}
      monthKey={monthKey}
      isCurrentMonth={monthKey === currentMonthKey()}
      ingresoEstimado={profile?.ingreso_estimado ?? null}
      data={data}
    />
  );
}
