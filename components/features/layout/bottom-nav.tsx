"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Flower2, House, Plus, ReceiptText, type LucideIcon } from "lucide-react";
import { useTransactions } from "@/components/features/transactions/transactions-provider";
import { cn, haptic } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };

/** Los módulos de las siguientes fases (Jardín, Presupuesto, Perfil…) se agregan aquí. */
const LEFT: NavItem[] = [
  { href: "/inicio", label: "Inicio", icon: House },
  { href: "/movimientos", label: "Movimientos", icon: ReceiptText },
];
const RIGHT: NavItem[] = [{ href: "/jardin", label: "Jardín", icon: Flower2 }];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className="relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-3xl text-xs font-bold"
    >
      {active ? (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-x-3 inset-y-1 rounded-3xl bg-primary-soft/70"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      ) : null}
      <Icon className={cn("relative size-6", active ? "text-primary-deep" : "text-muted-foreground")} aria-hidden />
      <span className={cn("relative", active ? "text-primary-deep" : "text-muted-foreground")}>{item.label}</span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { openNew } = useTransactions();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="glass flex w-full max-w-md items-center gap-1 rounded-4xl px-2 py-1.5 shadow-soft">
        {LEFT.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}

        <div className="flex flex-1 justify-center">
          <motion.button
            type="button"
            onClick={() => {
              haptic(8);
              openNew();
            }}
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="-mt-8 flex size-16 items-center justify-center rounded-full bg-brand text-white shadow-glow ring-4 ring-background"
            aria-label="Registrar gasto o ingreso"
          >
            <Plus className="size-8" strokeWidth={2.5} aria-hidden />
          </motion.button>
        </div>

        {RIGHT.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </div>
    </nav>
  );
}
