"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Sheet } from "@/components/ui/sheet";
import { deleteRecurring, saveRecurring } from "@/lib/actions/budget";
import { cn, haptic } from "@/lib/utils";
import type { Category, Tables } from "@/types/database";

type Props = {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  editing: Tables<"recurring_expenses"> | null;
};

const selectClass =
  "h-13 w-full rounded-2xl border border-border bg-white/80 px-4 font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15";

export function RecurringSheet({ open, onClose, categories, editing }: Props) {
  const [nombre, setNombre] = useState(editing?.nombre ?? "");
  const [monto, setMonto] = useState<number | null>(editing?.monto ?? null);
  const [dia, setDia] = useState(editing?.dia_mes ?? 1);
  const [categoryId, setCategoryId] = useState<string | null>(editing?.category_id ?? null);
  const [activo, setActivo] = useState(editing?.activo ?? true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  const valid = nombre.trim().length > 0 && (monto ?? 0) > 0;

  const save = () => {
    startTransition(async () => {
      const res = await saveRecurring(editing?.id ?? null, {
        nombre: nombre.trim(),
        monto: monto ?? 0,
        dia_mes: dia,
        category_id: categoryId,
        activo,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      haptic(10);
      toast.success(editing ? "Gasto fijo actualizado ✨" : "Gasto fijo agregado 🏠");
      onClose();
    });
  };

  return (
    <Sheet open={open} onClose={onClose} label={editing ? "Editar gasto fijo" : "Nuevo gasto fijo"}>
      <div className="flex flex-col gap-4 pb-2">
        <h2 className="font-display text-2xl font-semibold">{editing ? "Editar gasto fijo" : "Nuevo gasto fijo 🏠"}</h2>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Nombre</span>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Arriendo" maxLength={60} />
        </label>

        <div className="grid grid-cols-[1fr_auto] gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Monto</span>
            <MoneyInput value={monto} onValueChange={setMonto} placeholder="Ej: 900.000" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Día</span>
            <select value={dia} onChange={(e) => setDia(Number(e.target.value))} className={selectClass}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Categoría</span>
          <select value={categoryId ?? ""} onChange={(e) => setCategoryId(e.target.value || null)} className={selectClass}>
            <option value="">✨ Sin categoría (Otros)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.nombre}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          role="switch"
          aria-checked={activo}
          onClick={() => setActivo((v) => !v)}
          className="flex min-h-12 items-center justify-between rounded-2xl bg-white/70 px-4"
        >
          <span className="text-left">
            <span className="block font-semibold">Activo</span>
            <span className="block text-sm text-muted-foreground">Si lo desactivas, no se descuenta del día a día</span>
          </span>
          <span className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", activo ? "bg-primary-strong" : "bg-border")}>
            <span
              className={cn(
                "absolute top-1 size-5 rounded-full bg-white shadow transition-transform",
                activo ? "translate-x-6" : "translate-x-1",
              )}
            />
          </span>
        </button>

        <Button size="lg" className="w-full" disabled={!valid} loading={pending} onClick={save}>
          {editing ? "Guardar cambios" : "Agregar gasto fijo"}
        </Button>
        {editing ? (
          <Button variant="ghost" className="w-full text-danger" disabled={pending} onClick={() => setConfirmDelete(true)}>
            Eliminar gasto fijo
          </Button>
        ) : null}
      </div>

      {editing ? (
        <ConfirmDialog
          open={confirmDelete}
          title={`¿Eliminar ${editing.nombre}?`}
          description="Los movimientos que ya registraste no se borran."
          confirmLabel="Sí, eliminar"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            startTransition(async () => {
              const res = await deleteRecurring(editing.id);
              if (res.ok) {
                toast("Gasto fijo eliminado 🧹");
                onClose();
              } else toast.error(res.error);
            });
          }}
        />
      ) : null}
    </Sheet>
  );
}
