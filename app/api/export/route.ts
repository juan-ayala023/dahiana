import { NextResponse } from "next/server";
import { todayInBogota } from "@/lib/finance/format";
import { createClient } from "@/lib/supabase/server";

/** Escapa un valor para CSV (separador ";" para que Excel en español lo abra bien). */
function cell(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Descarga todos los movimientos como CSV (UTF-8 con BOM para Excel). */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizada" }, { status: 401 });

  const [tx, cats] = await Promise.all([
    supabase.from("transactions").select("*").order("fecha", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("categories").select("id, nombre, clasificacion"),
  ]);
  if (tx.error) return NextResponse.json({ error: "No se pudo exportar" }, { status: 500 });

  const byId = new Map((cats.data ?? []).map((c) => [c.id, c]));
  const header = ["Fecha", "Tipo", "Categoría", "Clasificación", "Monto (COP)", "Nota"];
  const rows = (tx.data ?? []).map((t) => {
    const c = t.category_id ? byId.get(t.category_id) : undefined;
    return [t.fecha, t.tipo === "gasto" ? "Gasto" : "Ingreso", c?.nombre ?? "Sin categoría", c?.clasificacion ?? "", t.monto, t.nota ?? ""];
  });

  const csv = "﻿" + [header, ...rows].map((r) => r.map(cell).join(";")).join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="florece-movimientos-${todayInBogota()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
