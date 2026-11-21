import type { Metadata } from "next";
import { MovementsView } from "@/components/features/transactions/movements-view";
import { getMonthTransactions } from "@/lib/data/queries";
import { parseMonthKey } from "@/lib/finance/dates";

export const metadata: Metadata = { title: "Movimientos" };

type Props = { searchParams: Promise<{ mes?: string }> };

export default async function MovimientosPage({ searchParams }: Props) {
  const { mes } = await searchParams;
  const monthKey = parseMonthKey(mes);
  const transactions = await getMonthTransactions(monthKey);

  return <MovementsView key={monthKey} monthKey={monthKey} transactions={transactions} />;
}
