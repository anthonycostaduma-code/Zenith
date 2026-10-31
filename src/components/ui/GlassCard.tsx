"use client";

import type { ElementType, ReactNode } from "react";

/**
 * Surface "Solid" (style Vercel / Linear).
 *
 * Le nom est conservé pour ne pas casser les imports existants, mais le rendu
 * n'utilise plus aucun `backdrop-blur` : les filtres de fond forcent le
 * compositeur à relire la zone sous l'élément à chaque frame, ce qui coûte très
 * cher sur mobile. On utilise donc des fonds opaques + une micro-ombre.
 */
export type GlassTone = "default" | "accent" | "plain";

export interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** Rend la carte interactive (compositing GPU + réaction à l'appui). */
  interactive?: boolean;
  tone?: GlassTone;
  as?: ElementType;
  onClick?: () => void;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

const BASE =
  "relative min-w-0 max-w-full rounded-2xl border shadow-sm " +
  "bg-white border-zinc-200 " +
  "dark:bg-zinc-900 dark:border-zinc-800";

export function GlassCard({
  children,
  className = "",
  interactive = false,
  tone = "default",
  as,
  onClick,
  style,
  ariaLabel,
}: GlassCardProps) {
  const Tag: ElementType = as ?? (onClick ? "button" : "div");

  const toneClass =
    tone === "accent"
      ? "ring-1 ring-[var(--accent-soft)]"
      : tone === "plain"
        ? "!border-transparent !bg-transparent !shadow-none"
        : "";

  // `transform-gpu` seulement là où une transformation est réellement animée.
  const motion = interactive
    ? "transform-gpu transition-transform duration-200 ease-out " +
      "hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer text-left"
    : "";

  return (
    <Tag
      className={`${BASE} ${toneClass} ${motion} ${className}`}
      onClick={onClick}
      style={style}
      aria-label={ariaLabel}
      {...(Tag === "button" ? { type: "button" as const } : {})}
    >
      {children}
    </Tag>
  );
}

/** Ligne interne compacte. */
export function GlassRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 max-w-full rounded-xl bg-zinc-100 px-3 py-2.5 dark:bg-zinc-800/60 ${className}`}>
      {children}
    </div>
  );
}
