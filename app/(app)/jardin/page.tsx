import type { Metadata } from "next";
import { GardenView } from "@/components/features/garden/garden-view";
import { getGarden } from "@/lib/data/queries";

export const metadata: Metadata = { title: "Mi jardín" };

export default async function JardinPage() {
  const { goals, fixedMonthly } = await getGarden();
  return <GardenView goals={goals} fixedMonthly={fixedMonthly} />;
}
