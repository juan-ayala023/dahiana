import type { Metadata } from "next";
import { AuthShell } from "@/components/features/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { enterWithLink } from "@/lib/auth/actions";

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
      <form action={enterWithLink} className="mt-6 flex flex-col gap-3">
        <label htmlFor="enlace" className="text-sm font-semibold">
          ¿Abriste la app desde la pantalla de inicio? Pega aquí tu enlace
        </label>
        <Input id="enlace" name="enlace" placeholder="https://…/entrar/…" autoComplete="off" autoCapitalize="none" spellCheck={false} required />
        <Button type="submit" className="w-full">
          Entrar 🌷
        </Button>
      </form>
    </AuthShell>
  );
}
