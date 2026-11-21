"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Sheet } from "@/components/ui/sheet";
import { createGoal, updateGoal } from "@/lib/actions/goals";
import { todayInBogota } from "@/lib/finance/format";
import { cn, haptic } from "@/lib/utils";
import { GOAL_COLORS, type GoalInput } from "@/lib/validations/goal";

const EMOJIS = ["🌷", "✈️", "🛟", "💻", "🏖️", "🎓", "🏠", "🚗", "💍", "🎁", "📱", "🐶", "👗", "🎄", "💆‍♀️", "🎸"];

export type GoalDraft = GoalInput;

type GoalFormSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Si viene `id`, edita esa meta; si no, crea una nueva con estos valores iniciales. */
  initial?: Partial<GoalDraft> & { id?: string };
};

export function GoalFormSheet({ open, onClose, initial }: GoalFormSheetProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const editingId = initial?.id;

  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "🌷");
  const [color, setColor] = useState<string>(initial?.color ?? GOAL_COLORS[0]);
  const [monto, setMonto] = useState<number | null>(initial?.monto_objetivo ?? null);
  const [fecha, setFecha] = useState(initial?.fecha_objetivo ?? "");
  const esFondo = initial?.es_fondo_emergencia ?? false;

  const valid = nombre.trim().length > 0 && (monto ?? 0) > 0;

  const submit = () => {
    if (!valid) return;
    const input: GoalDraft = {
      nombre: nombre.trim(),
      emoji,
      color,
      monto_objetivo: monto ?? 0,
      fecha_objetivo: fecha || null,
      es_fondo_emergencia: esFondo,
    };
    startTransition(async () => {
      const res = editingId ? await updateGoal(editingId, input) : await createGoal(input);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      haptic(10);
      toast.success(editingId ? "Meta actualizada ✨" : "¡Sembraste una nueva flor! 🌱");
      onClose();
      if (!editingId && "id" in res && res.id) router.push(`/jardin/${res.id}`);
    });
  };

  return (
    <Sheet open={open} onClose={onClose} label={editingId ? "Editar meta" : "Nueva meta"}>
      <div className="flex flex-col gap-5 pb-2">
        <h2 className="font-display text-2xl font-semibold">{editingId ? "Editar meta" : "Sembrar una nueva flor 🌱"}</h2>

        <div>
          <p className="mb-2 text-sm font-semibold">Elige un emoji</p>
          <div role="radiogroup" aria-label="Emoji de la meta" className="grid grid-cols-8 gap-1.5">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                role="radio"
                aria-checked={emoji === e}
                aria-label={e}
                onClick={() => setEmoji(e)}
                className={cn(
                  "flex aspect-square min-h-11 items-center justify-center rounded-2xl text-xl transition-shadow",
                  emoji === e ? "bg-primary-soft shadow-[0_0_0_2px_var(--primary)]" : "bg-white/70",
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">¿Para qué ahorras?</span>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Viaje a Cartagena" maxLength={60} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">¿Cuánto necesitas?</span>
          <MoneyInput value={monto} onValueChange={setMonto} placeholder="Ej: 1.500.000" />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">
            ¿Para cuándo? <span className="font-normal text-muted-foreground">(opcional)</span>
          </span>
          <Input type="date" min={todayInBogota()} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </label>

        <div>
          <p className="mb-2 text-sm font-semibold">Color de tu flor</p>
          <div role="radiogroup" aria-label="Color de la flor" className="flex gap-3">
            {GOAL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={color === c}
                aria-label={`Color ${c}`}
                onClick={() => setColor(c)}
                className={cn(
                  "size-11 rounded-full transition-transform",
                  color === c ? "scale-110 shadow-[0_0_0_3px_white,0_0_0_5px_var(--primary)]" : "",
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <Button size="lg" className="w-full" disabled={!valid} loading={pending} onClick={submit}>
          {editingId ? "Guardar cambios" : "Sembrar mi flor 🌱"}
        </Button>
      </div>
    </Sheet>
  );
}
