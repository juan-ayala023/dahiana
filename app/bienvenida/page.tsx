import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/features/onboarding/onboarding-flow";
import { getSession } from "@/lib/data/queries";

export const metadata: Metadata = { title: "Bienvenida" };

export default async function BienvenidaPage() {
  const { profile } = await getSession();
  if (profile?.onboarding_completo) redirect("/inicio");

  return <OnboardingFlow initialName={profile?.nombre ?? ""} />;
}
