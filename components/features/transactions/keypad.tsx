"use client";

import { motion } from "framer-motion";
import { Delete } from "lucide-react";
import { haptic } from "@/lib/utils";

export type KeypadKey = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "000" | "back";

const KEYS: KeypadKey[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "back"];

/** Teclado numérico propio, grande y con respuesta táctil. */
export function Keypad({ onKey }: { onKey: (key: KeypadKey) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Teclado numérico">
      {KEYS.map((key) => (
        <motion.button
          key={key}
          type="button"
          whileTap={{ scale: 0.92, backgroundColor: "rgba(246,214,228,0.9)" }}
          transition={{ type: "spring", stiffness: 600, damping: 30 }}
          onClick={() => {
            haptic(5);
            onKey(key);
          }}
          aria-label={key === "back" ? "Borrar" : key === "000" ? "Tres ceros" : key}
          className="flex h-14 items-center justify-center rounded-2xl bg-white/70 font-display text-2xl font-medium text-foreground shadow-[0_1px_0_rgba(74,53,64,0.05)] tabular select-none"
        >
          {key === "back" ? <Delete className="size-6 text-muted-foreground" aria-hidden /> : key}
        </motion.button>
      ))}
    </div>
  );
}

/** Aplica una tecla a la cadena de dígitos del monto (máx. 12 dígitos). */
export function applyKey(digits: string, key: KeypadKey): string {
  if (key === "back") return digits.slice(0, -1);
  if (digits === "" && (key === "0" || key === "000")) return digits;
  return (digits + key).slice(0, 12);
}
