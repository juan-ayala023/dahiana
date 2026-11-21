import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { GoalDetail } from "@/components/features/garden/goal-detail";
import { getGoalDetail, getSession } from "@/lib/data/queries";

export const metadata: Metadata = { title: "Mi meta" };

type Props = { params: Promise<{ id: string }> };

export default async function GoalPage({ params }: Props) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const [{ profile }, detail] = await Promise.all([getSession(), getGoalDetail(id)]);
  if (!detail) notFound();

  return (
    <GoalDetail
      goal={detail.goal}
      contributions={detail.contributions}
      frecuencia={profile?.frecuencia_pago ?? "mensual"}
      nombre={profile?.nombre || "linda"}
    />
  );
}
