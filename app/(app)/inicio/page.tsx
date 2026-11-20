import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { FlowerMark } from "@/components/features/brand/logo";
import { greetingFor, hourInBogota } from "@/lib/finance/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Inicio" };

/**
 * Inicio de la fase 1: confirma que la sesión, el trigger de perfil y el RLS
 * funcionan. En la fase 2 se envuelve en el layout con bottom nav y en la
 * fase 3 se convierte en el dashboard completo.
 */
export default async function InicioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { count: categorias }] = await Promise.all([
    supabase.from("profiles").select("nombre, avatar_emoji").eq("id", user.id).maybeSingle(),
    supabase.from("categories").select("id", { count: "exact", head: true }),
  ]);

  const { text, emoji } = greetingFor(hourInBogota());
  const nombre = profile?.nombre || "linda";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-5 pb-10 pt-[max(2rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-2xl" aria-hidden>
            {profile?.avatar_emoji ?? "🌸"}
          </span>
          <div>
            <p className="text-sm text-muted-foreground">
              {text} {emoji}
            </p>
            <h1 className="font-display text-2xl font-semibold">{nombre}</h1>
          </div>
        </div>
      </header>

      <Card className="flex flex-col items-center gap-3 bg-hero py-10 text-center">
        <FlowerMark className="size-16" />
        <p className="font-display text-2xl font-semibold">Tu jardín está listo ✨</p>
        <p className="text-muted-foreground">
          Ya tienes {categorias ?? 0} categorías creadas. Muy pronto podrás registrar tus gastos aquí.
        </p>
      </Card>
    </main>
  );
}
