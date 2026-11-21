"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { transactionSchema, type ActionResult, type TransactionInput } from "@/lib/validations/transaction";

const GENERIC_ERROR = "No pudimos guardar. Revisa tu conexión e intenta de nuevo 🌧️";

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? GENERIC_ERROR;
}

export async function createTransaction(input: TransactionInput): Promise<ActionResult> {
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("transactions").insert(parsed.data);
  if (error) {
    console.error("[createTransaction]", error.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateTransaction(input: TransactionInput): Promise<ActionResult> {
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const { id, ...changes } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").update(changes).eq("id", id);
  if (error) {
    console.error("[updateTransaction]", error.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: GENERIC_ERROR };

  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) {
    console.error("[deleteTransaction]", error.message);
    return { ok: false, error: "No pudimos eliminarlo. Intenta de nuevo 🌧️" };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
