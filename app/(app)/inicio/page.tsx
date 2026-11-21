import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { FlowerMark } from "@/components/features/brand/logo";
import { getSession } from "@/lib/data/queries";
import { greetingFor, hourInBogota } from "@/lib/finance/format";

export const metadata: Metadata = { title: "Inicio" };

/** Inicio de la fase 2. En la fase 3 se convierte en el dashboard completo. */
export default async function InicioPage() {
  const { profile } = await getSession();
  const { text, emoji } = greetingFor(hourInBogota());

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-2xl" aria-hidden>
          {profile?.avatar_emoji ?? "🌸"}
        </span>
        <div>
          <p className="text-sm text-muted-foreground">
            {text} {emoji}
          </p>
          <h1 className="font-display text-2xl font-semibold">{profile?.nombre || "linda"}</h1>
        </div>
      </header>

      <Card className="flex flex-col items-center gap-3 bg-hero py-10 text-center">
        <FlowerMark className="size-16" />
        <p className="font-display text-2xl font-semibold">Tu jardín está listo ✨</p>
        <p className="text-muted-foreground">
          Toca el botón <span className="font-bold text-primary-deep">+</span> de abajo cada vez que gastes o recibas
          plata. Son solo 3 toques 💖
        </p>
      </Card>
    </div>
  );
}
