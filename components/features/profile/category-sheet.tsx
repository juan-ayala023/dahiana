"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { deleteCategory, saveCategory } from "@/lib/actions/profile";
import { cn, haptic } from "@/lib/utils";
import type { Category, ClasificacionGasto, TipoMovimiento } from "@/types/database";

const EMOJIS = ["💅", "🛍️", "🍓", "🚕", "☕", "🏠", "💊", "🎓", "🎁", "✨", "🍔", "🍷", "🎬", "🐶", "👗", "💇‍♀️", "🏋️", "📱", "✈️", "🧴", "💼", "💫", "🎀", "💸"];
const COLORS = ["#F4A7C3", "#C9B6E4", "#FF9AA8", "#FFD3B6", "#E8C4A8", "#B8D8E8", "#8FD5B6", "#A8B8F0", "#F6C1D9", "#E0D4DA"];

type Props = {
  open: boolean;
  onClose: () => void;
  tipo: TipoMovimiento;
  editing: Category | null;
};

export function CategorySheet({ open, onClose, tipo, editing }: Props) {
  const [nombre, setNombre] = useState(editing?.nombre ?? "");
  const [emoji, setEmoji] = useState(editing?.emoji ?? (tipo === "gasto" ? "✨" : "💫"));
  const [color, setColor] = useState(editing?.color ?? COLORS[0]!);
  const [clasificacion, setClasificacion] = useState<ClasificacionGasto>(editing?.clasificacion ?? "gusto");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const realTipo = editing?.tipo ?? tipo;

  const save = () => {
    startTransition(async () => {
      const res = await saveCategory(editing?.id ?? null, {
        nombre: nombre.trim(),
        emoji: emoji.trim(),
        color,
        tipo: realTipo,
        clasificacion: realTipo === "gasto" ? clasificacion : null,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      haptic(10);
      toast.success(editing ? "Categoría actualizada ✨" : `${emoji} ${nombre.trim()} lista para usar`);
      onClose();
    });
  };

  return (
    <Sheet open={open} onClose={onClose} label={editing ? "Editar categoría" : "Nueva categoría"}>
      <div className="flex flex-col gap-5 pb-2">
        <div className="flex items-center gap-3">
          <span
            className="flex size-14 items-center justify-center rounded-2xl text-3xl"
            style={{ backgroundColor: `${color}66` }}
            aria-hidden
          >
            {emoji || "✨"}
          </span>
          <h2 className="font-display text-2xl font-semibold">
            {editing ? "Editar categoría" : realTipo === "gasto" ? "Nueva categoría de gasto" : "Nueva categoría de ingreso"}
          </h2>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Nombre</span>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Mascotas" maxLength={40} />
        </label>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Emoji</p>
            <Input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              aria-label="Escribe tu propio emoji"
              maxLength={8}
              className="h-11 w-24 text-center text-xl"
            />
          </div>
          <div role="radiogroup" aria-label="Emoji" className="grid grid-cols-8 gap-1.5">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                role="radio"
                aria-checked={emoji === e}
                aria-label={e}
                onClick={() => setEmoji(e)}
                className={cn(
                  "flex aspect-square min-h-11 items-center justify-center rounded-2xl text-xl",
                  emoji === e ? "bg-primary-soft shadow-[0_0_0_2px_var(--primary)]" : "bg-white/70",
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Color</p>
          <div role="radiogroup" aria-label="Color" className="flex flex-wrap gap-2.5">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={color === c}
                aria-label={`Color ${c}`}
                onClick={() => setColor(c)}
                className={cn("size-11 rounded-full", color === c && "shadow-[0_0_0_3px_var(--surface),0_0_0_5px_var(--primary)]")}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {realTipo === "gasto" ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold">¿Qué tipo de gasto es? (50/30/20)</p>
            <Segmented
              id="cat-clase"
              label="Clasificación"
              value={clasificacion}
              onChange={setClasificacion}
              options={[
                { value: "necesidad", label: "🏠 Necesidad" },
                { value: "gusto", label: "💅 Gusto" },
                { value: "ahorro", label: "🐷 Ahorro" },
              ]}
            />
          </div>
        ) : null}

        <Button size="lg" className="w-full" disabled={!nombre.trim() || !emoji.trim()} loading={pending} onClick={save}>
          {editing ? "Guardar cambios" : "Crear categoría"}
        </Button>
        {editing ? (
          <Button variant="ghost" className="w-full text-danger" disabled={pending} onClick={() => setConfirmDelete(true)}>
            Eliminar categoría
          </Button>
        ) : null}
      </div>

      {editing ? (
        <ConfirmDialog
          open={confirmDelete}
          title={`¿Eliminar ${editing.nombre}?`}
          description="Tus movimientos se conservan, pero quedarán sin categoría. Sus límites de presupuesto se borran."
          confirmLabel="Sí, eliminar"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            startTransition(async () => {
              const res = await deleteCategory(editing.id);
              if (res.ok) {
                toast("Categoría eliminada 🧹");
                onClose();
              } else toast.error(res.error);
            });
          }}
        />
      ) : null}
    </Sheet>
  );
}
