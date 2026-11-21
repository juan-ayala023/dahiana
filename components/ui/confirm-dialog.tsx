"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  emoji?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  emoji = "🥺",
  confirmLabel,
  cancelLabel = "Mejor no",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    requestAnimationFrame(() => cancelRef.current?.focus());
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
          <motion.div
            className="absolute inset-0 bg-[#4A3540]/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            aria-hidden
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby={description ? "confirm-desc" : undefined}
            className="glass relative w-full max-w-sm rounded-4xl bg-white/90 p-6 text-center shadow-soft"
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
          >
            <div className="text-5xl" aria-hidden>
              {emoji}
            </div>
            <h2 id="confirm-title" className="mt-3 font-display text-xl font-semibold">
              {title}
            </h2>
            {description ? (
              <p id="confirm-desc" className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button ref={cancelRef} variant="soft" onClick={onCancel}>
                {cancelLabel}
              </Button>
              <Button onClick={onConfirm}>{confirmLabel}</Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
