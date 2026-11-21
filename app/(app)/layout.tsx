import { redirect } from "next/navigation";
import { BottomNav } from "@/components/features/layout/bottom-nav";
import { TransactionsProvider } from "@/components/features/transactions/transactions-provider";
import { getCategories, getSession } from "@/lib/data/queries";

/** Layout autenticado: exige onboarding completo y monta el registro rápido global. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getSession();
  if (!profile?.onboarding_completo) redirect("/bienvenida");

  const categories = await getCategories();

  return (
    <TransactionsProvider categories={categories}>
      <div className="mx-auto min-h-dvh w-full max-w-md px-5 pb-36 pt-[max(1.5rem,env(safe-area-inset-top))]">
        {children}
      </div>
      <BottomNav />
    </TransactionsProvider>
  );
}
