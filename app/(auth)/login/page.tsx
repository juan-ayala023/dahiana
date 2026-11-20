import type { Metadata } from "next";
import { AuthShell } from "@/components/features/auth/auth-shell";

export const metadata: Metadata = { title: "App privada" };

type Props = { searchParams: Promise<{ error?: string }> };

/** Pantalla para quien llega sin sesión: la app solo se abre con el enlace personal. */
export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams;

  const message =
    error === "servidor"
      ? "Tu jardín está tomando una siesta. Intenta abrir tu enlace de nuevo en un momento 🌧️"
      : error === "enlace"
        ? "Ese enlace no es válido. Usa el enlace personal que te compartieron 💌"
        : "Para entrar, abre tu enlace personal una vez desde este dispositivo. Después la app se abre sola ✨";

  return (
    <AuthShell title="Esta app es privada 🌸" subtitle="Un jardín hecho solo para una persona">
      <p role={error ? "alert" : undefined} className="text-center text-muted-foreground">
        {message}
      </p>
    </AuthShell>
  );
}
