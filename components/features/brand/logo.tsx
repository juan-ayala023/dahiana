import { APP_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";

/** Flor de cinco pétalos: el símbolo de la app. */
export function FlowerMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-12", className)} aria-hidden>
      <defs>
        <linearGradient id="petal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F6D6E4" />
          <stop offset="55%" stopColor="#D97BA6" />
          <stop offset="100%" stopColor="#B44D7E" />
        </linearGradient>
        <radialGradient id="core" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0%" stopColor="#FFF1E6" />
          <stop offset="100%" stopColor="#FFC49E" />
        </radialGradient>
      </defs>
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse
          key={deg}
          cx="32"
          cy="18"
          rx="10"
          ry="15"
          fill="url(#petal)"
          opacity="0.92"
          transform={`rotate(${deg} 32 32)`}
        />
      ))}
      <circle cx="32" cy="32" r="8" fill="url(#core)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <FlowerMark className="size-10" />
      <span className="font-display text-2xl font-semibold tracking-tight text-foreground">{APP_NAME}</span>
    </div>
  );
}
