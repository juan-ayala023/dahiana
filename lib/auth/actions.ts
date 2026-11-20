"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Cierra la sesión en este dispositivo. Para volver a entrar se necesita el
 * enlace personal, por eso en Perfil (fase 7) se pedirá confirmación.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
