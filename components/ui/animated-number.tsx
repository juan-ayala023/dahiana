"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { formatCOP } from "@/lib/finance/format";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

type AnimatedNumberProps = {
  value: number;
  className?: string;
  /** Formato del número (por defecto, pesos colombianos). */
  format?: (n: number) => string;
  duration?: number;
};

/** Número que "cuenta" hasta su valor cuando aparece o cambia. */
export function AnimatedNumber({ value, className, format = formatCOP, duration = 0.9 }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const from = useRef(0);
  const reduce = useReducedMotion();

  useIsoLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduce) {
      node.textContent = format(value);
      from.current = value;
      return;
    }
    const controls = animate(from.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        node.textContent = format(Math.round(v));
      },
    });
    from.current = value;
    return () => controls.stop();
  }, [value, reduce, duration, format]);

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}
