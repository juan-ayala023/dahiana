"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { updateProfile } from "@/lib/actions/profile";
import { cn, haptic } from "@/lib/utils";
import type { FrecuenciaPago, Profile } from "@/types/database";

const AVATARS = ["🌸", "🌷", "🌻", "🦋", "🐱", "🐰", "🍓", "🌙", "✨", "💅", "👑", "🌈"];
const selectClass =
  "h-13 w-full rounded-2xl border border-border bg-white/80 px-4 font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15";

function DaySelect({ label, value, onChange }: { label: string; value: number; onChange: (d: number) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold">{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))} className={selectClass}>
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>
            Día {d}
          </option>
        ))}
      </select>
    </label>
  );
}

type Props = { open: boolean; onClose: () => void; profile: Profile };

export function ProfileSheet({ open, onClose, profile }: Props) {
  const [nombre, setNombre] = useState(profile.nombre);
  const [avatar, setAvatar] = useState(profile.avatar_emoji);
  const [frecuencia, setFrecuencia] = useState<FrecuenciaPago>(profile.frecuencia_pago);
  const [dias, setDias] = useState<[number, number]>([
    profile.dias_pago[0] ?? 15,
    profile.dias_pago[1] ?? profile.dias_pago[0] ?? 30,
  ]);
  const [ingreso, setIngreso] = useState<number | null>(profile.ingreso_estimado);
  const [pending, startTransition] = useTransition();

  const save = () => {
    const diasPago = frecuencia === "quincenal" ? [...dias].sort((a, b) => a - b) : frecuencia === "mensual" ? [dias[1]] : [1];
    startTransition(async () => {
      const res = await updateProfile({
        nombre: nombre.trim(),
        avatar_emoji: avatar,
        frecuencia_pago: frecuencia,
        dias_pago: diasPago,
        ingreso_estimado: ingreso,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      haptic(10);
      toast.success("Tus datos quedaron guardados ✨");
      onClose();
    });
  };

  return (
    <Sheet open={open} onClose={onClose} label="Editar mis datos">
      <div className="flex flex-col gap-5 pb-2">
        <h2 className="font-display text-2xl font-semibold">Mis datos</h2>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Nombre</span>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={40} autoComplete="given-name" />
        </label>

        <div>
          <p className="mb-2 text-sm font-semibold">Avatar</p>
          <div role="radiogroup" aria-label="Avatar" className="grid grid-cols-6 gap-2">
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={avatar === a}
                aria-label={a}
                onClick={() => setAvatar(a)}
                className={cn(
                  "flex aspect-square min-h-11 items-center justify-center rounded-2xl text-2xl",
                  avatar === a ? "bg-primary-soft shadow-[0_0_0_2px_var(--primary)]" : "bg-white/70",
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold">¿Cada cuánto te pagan?</p>
          <Segmented
            id="perfil-frecuencia"
            label="Frecuencia de pago"
            value={frecuencia}
            onChange={setFrecuencia}
            options={[
              { value: "quincenal", label: "Quincenal" },
              { value: "mensual", label: "Mensual" },
              { value: "variable", label: "Variable" },
            ]}
          />
          {frecuencia === "quincenal" ? (
            <div className="grid grid-cols-2 gap-3">
              <DaySelect label="Primer pago" value={dias[0]} onChange={(d) => setDias([d, dias[1]])} />
              <DaySelect label="Segundo pago" value={dias[1]} onChange={(d) => setDias([dias[0], d])} />
            </div>
          ) : frecuencia === "mensual" ? (
            <DaySelect label="Día de pago" value={dias[1]} onChange={(d) => setDias([dias[0], d])} />
          ) : null}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">
            Ingreso mensual aproximado <span className="font-normal text-muted-foreground">(opcional)</span>
          </span>
          <MoneyInput value={ingreso} onValueChange={setIngreso} placeholder="Ej: 2.500.000" />
        </label>

        <Button size="lg" className="w-full" disabled={!nombre.trim()} loading={pending} onClick={save}>
          Guardar
        </Button>
      </div>
    </Sheet>
  );
}
