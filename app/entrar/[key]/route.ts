import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Compara en tiempo constante (evita adivinar la clave midiendo tiempos). */
function sameKey(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Enlace personal de acceso: /entrar/<ACCESS_KEY>.
 * Abre la sesión de la dueña con credenciales que solo viven en el servidor y
 * la deja guardada en el dispositivo; desde ahí la app entra directo.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const { origin } = request.nextUrl;

  const accessKey = process.env.ACCESS_KEY;
  const email = process.env.OWNER_EMAIL;
  const password = process.env.OWNER_PASSWORD;

  if (!accessKey || !email || !password || !sameKey(key, accessKey)) {
    return NextResponse.redirect(new URL("/login?error=enlace", origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("[entrar] No se pudo abrir la sesión:", error.message);
    return NextResponse.redirect(new URL("/login?error=servidor", origin));
  }

  return NextResponse.redirect(new URL("/inicio", origin));
}
