"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Download, LogOut, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Segmented } from "@/components/ui/segmented";
import { useTransactions } from "@/components/features/transactions/transactions-provider";
import { signOut } from "@/lib/auth/actions";
import { formatCOP } from "@/lib/finance/format";
import { applyTheme, readThemePreference, type ThemePreference } from "@/lib/theme";
import type { Category, Profile, TipoMovimiento } from "@/types/database";
import { CategorySheet } from "./category-sheet";
import { InstallCard } from "./install-card";
import { ProfileSheet } from "./profile-sheet";

const FREQ_LABEL = { quincenal: "Quincenal", mensual: "Mensual", variable: "Variable" } as const;
const CLASS_LABEL = { necesidad: "Necesidad", gusto: "Gusto", ahorro: "Ahorro" } as const;

export function ProfileView({ profile }: { profile: Profile }) {
  const { categories } = useTransactions();
  const [profileSheet, setProfileSheet] = useState(0);
  const [catTab, setCatTab] = useState<TipoMovimiento>("gasto");
  const [catSheet, setCatSheet] = useState<{ session: number; editing: Category | null } | null>(null);
  const [theme, setTheme] = useState<ThemePreference>("system");
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => setTheme(readThemePreference()), []);

  const diasTexto =
    profile.frecuencia_pago === "variable" ? "Ingresos variables" : `Días ${profile.dias_pago.join(" y ")} de cada mes`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/inicio"
          className="flex size-11 items-center justify-center rounded-full bg-surface shadow-soft active:scale-95"
          aria-label="Volver al inicio"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <h1 className="font-display text-3xl font-semibold">Mi perfil</h1>
      </div>

      {/* Datos */}
      <section className="flex items-center gap-4 rounded-4xl bg-hero p-5 shadow-soft" aria-label="Mis datos">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-white/70 text-4xl" aria-hidden>
          {profile.avatar_emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-2xl font-semibold">{profile.nombre}</p>
          <p className="text-sm text-foreground/80">
            {FREQ_LABEL[profile.frecuencia_pago]} · {diasTexto}
          </p>
          {profile.ingreso_estimado ? (
            <p className="text-sm text-foreground/80">Ingreso estimado: {formatCOP(profile.ingreso_estimado)}</p>
          ) : null}
        </div>
        <Button variant="outline" size="icon" aria-label="Editar mis datos" onClick={() => setProfileSheet((n) => n + 1)}>
          <Pencil aria-hidden />
        </Button>
      </section>

      {/* Apariencia */}
      <section aria-labelledby="apariencia" className="flex flex-col gap-3">
        <h2 id="apariencia" className="font-display text-xl font-semibold">
          Apariencia
        </h2>
        <Segmented
          id="tema"
          label="Tema de la app"
          value={theme}
          onChange={(v) => {
            setTheme(v);
            applyTheme(v);
          }}
          options={[
            { value: "system", label: "📱 Sistema" },
            { value: "light", label: "☀️ Claro" },
            { value: "dark", label: "🌙 Oscuro" },
          ]}
        />
      </section>

      {/* Categorías */}
      <section aria-labelledby="categorias" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 id="categorias" className="font-display text-xl font-semibold">
            Categorías
          </h2>
          <Button
            size="icon"
            variant="soft"
            aria-label="Nueva categoría"
            onClick={() => setCatSheet((s) => ({ session: (s?.session ?? 0) + 1, editing: null }))}
          >
            <Plus aria-hidden />
          </Button>
        </div>
        <Segmented
          id="cat-tab"
          label="Tipo de categoría"
          value={catTab}
          onChange={setCatTab}
          options={[
            { value: "gasto", label: "Gastos" },
            { value: "ingreso", label: "Ingresos" },
          ]}
        />
        <ul className="grid grid-cols-2 gap-2">
          {categories
            .filter((c) => c.tipo === catTab)
            .map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setCatSheet((s) => ({ session: (s?.session ?? 0) + 1, editing: c }))}
                  className="flex w-full items-center gap-2 rounded-3xl bg-surface p-3 text-left shadow-soft active:scale-[0.97]"
                  aria-label={`Editar ${c.nombre}`}
                >
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-xl"
                    style={{ backgroundColor: `${c.color}55` }}
                    aria-hidden
                  >
                    {c.emoji}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{c.nombre}</span>
                    {c.clasificacion ? (
                      <span className="block text-xs text-muted-foreground">{CLASS_LABEL[c.clasificacion]}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
        </ul>
      </section>

      {/* Accesos */}
      <section aria-label="Más opciones" className="flex flex-col overflow-hidden rounded-4xl bg-surface shadow-soft">
        {[
          { href: "/presupuesto", emoji: "🏠", label: "Gastos fijos y presupuesto" },
          { href: "/escuelita", emoji: "🎓", label: "Escuelita financiera" },
          { href: "/logros", emoji: "🏆", label: "Mis logros y racha" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-14 items-center gap-3 border-b border-border px-4 last:border-b-0 active:bg-primary-soft/30"
          >
            <span className="text-xl" aria-hidden>
              {item.emoji}
            </span>
            <span className="flex-1 font-semibold">{item.label}</span>
            <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
          </Link>
        ))}
        <a href="/api/export" download className="flex min-h-14 items-center gap-3 px-4 active:bg-primary-soft/30">
          <Download className="size-5 text-primary-deep" aria-hidden />
          <span className="flex-1">
            <span className="block font-semibold">Exportar movimientos</span>
            <span className="block text-xs text-muted-foreground">Archivo CSV para Excel o Google Sheets</span>
          </span>
        </a>
      </section>

      <InstallCard />

      <Button variant="ghost" className="w-full text-danger" onClick={() => setConfirmLogout(true)}>
        <LogOut aria-hidden /> Cerrar sesión
      </Button>

      {profileSheet > 0 ? (
        <ProfileSheet key={profileSheet} open onClose={() => setProfileSheet(0)} profile={profile} />
      ) : null}
      {catSheet ? (
        <CategorySheet key={catSheet.session} open onClose={() => setCatSheet(null)} tipo={catTab} editing={catSheet.editing} />
      ) : null}

      <ConfirmDialog
        open={confirmLogout}
        emoji="🔐"
        title="¿Cerrar sesión?"
        description="Para volver a entrar en este celular necesitarás tu enlace personal."
        confirmLabel="Sí, cerrar"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false);
          void signOut();
        }}
      />
    </div>
  );
}
