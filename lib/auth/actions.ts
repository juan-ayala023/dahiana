"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Cierra la sesión en este dispositivo. Para volver a entrar se necesita el
 * enlace personal (por eso Perfil pide confirmación).
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Permite pegar el enlace personal (o solo la clave) dentro de la app. Útil en
 * iPhone: la app instalada en la pantalla de inicio no comparte sesión con Safari.
 */
export async function enterWithLink(formData: FormData): Promise<void> {
  const raw = String(formData.get("enlace") ?? "").trim();
  const fromUrl = raw.match(/\/entrar\/([A-Za-z0-9_-]+)/)?.[1];
  const key = fromUrl ?? raw;
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(key)) redirect("/login?error=enlace");
  redirect(`/entrar/${key}`);
}
