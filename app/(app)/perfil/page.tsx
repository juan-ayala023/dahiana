import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileView } from "@/components/features/profile/profile-view";
import { getSession } from "@/lib/data/queries";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function PerfilPage() {
  const { profile } = await getSession();
  if (!profile) redirect("/login");
  return <ProfileView profile={profile} />;
}
