"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { categorySchema, profileSchema, type CategoryInput, type ProfileInput } from "@/lib/validations/profile";
import type { ActionResult } from "@/lib/validations/transaction";

const GENERIC = "No pudimos guardar. Revisa tu conexión e intenta de nuevo 🌧️";
const uuid = z.string().uuid();

export async function updateProfile(input: ProfileInput): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? GENERIC };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Tu sesión expiró. Abre de nuevo tu enlace 💌" };

  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id);
  if (error) {
    console.error("[updateProfile]", error.message);
    return { ok: false, error: GENERIC };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveCategory(id: string | null, input: CategoryInput): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? GENERIC };
  if (id !== null && !uuid.safeParse(id).success) return { ok: false, error: GENERIC };

  const supabase = await createClient();
  let error;
  if (id) {
    // El tipo de una categoría existente no cambia (sus movimientos dependen de él).
    const { nombre, emoji, color, clasificacion } = parsed.data;
    ({ error } = await supabase.from("categories").update({ nombre, emoji, color, clasificacion }).eq("id", id));
  } else {
    const { count } = await supabase.from("categories").select("id", { count: "exact", head: true }).eq("tipo", parsed.data.tipo);
    ({ error } = await supabase.from("categories").insert({ ...parsed.data, orden: (count ?? 0) + 1 }));
  }

  if (error) {
    if (error.code === "23505") return { ok: false, error: "Ya tienes una categoría con ese nombre 🙈" };
    console.error("[saveCategory]", error.message);
    return { ok: false, error: GENERIC };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Elimina una categoría. Sus movimientos se conservan "sin categoría". */
export async function deleteCategory(id: string): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return { ok: false, error: GENERIC };
  const supabase = await createClient();

  const { data: cat } = await supabase.from("categories").select("tipo").eq("id", id).maybeSingle();
  if (!cat) return { ok: false, error: GENERIC };
  const { count } = await supabase.from("categories").select("id", { count: "exact", head: true }).eq("tipo", cat.tipo);
  if ((count ?? 0) <= 1) return { ok: false, error: "Necesitas al menos una categoría de este tipo 🌱" };

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    console.error("[deleteCategory]", error.message);
    return { ok: false, error: "No pudimos eliminarla 🌧️" };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
