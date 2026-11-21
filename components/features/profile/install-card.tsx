"use client";

import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/** Invita a instalar la app en la pantalla de inicio (Android: botón; iPhone: instrucciones). */
export function InstallCard() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <div className="flex items-center gap-3 rounded-3xl bg-income/20 p-4">
        <span className="text-2xl" aria-hidden>
          📲
        </span>
        <p className="text-sm font-medium">La app ya está instalada en tu celular ✨</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-lavender/25 p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden>
          📲
        </span>
        <div>
          <p className="font-bold">Tenla en tu pantalla de inicio</p>
          {isIOS ? (
            <p className="mt-1 text-sm">
              En Safari toca <Share className="inline size-4 align-text-bottom" aria-label="Compartir" /> y luego{" "}
              <strong>&quot;Agregar a inicio&quot;</strong>. Se abrirá como una app, a pantalla completa.
            </p>
          ) : deferred ? (
            <p className="mt-1 text-sm">Se abre a pantalla completa, como cualquier app 💖</p>
          ) : (
            <p className="mt-1 text-sm">
              En el menú del navegador (⋮) elige <strong>&quot;Instalar app&quot;</strong> o <strong>&quot;Agregar a la pantalla de inicio&quot;</strong>.
            </p>
          )}
        </div>
      </div>
      {deferred ? (
        <Button
          size="sm"
          className="self-start"
          onClick={async () => {
            await deferred.prompt();
            const { outcome } = await deferred.userChoice;
            if (outcome === "accepted") setInstalled(true);
            setDeferred(null);
          }}
        >
          <Download aria-hidden /> Instalar Florece
        </Button>
      ) : null}
    </div>
  );
}
