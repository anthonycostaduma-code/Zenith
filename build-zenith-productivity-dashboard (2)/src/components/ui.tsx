"use client";

import { useState, type ReactNode } from "react";
import { IconClose } from "./icons";

export function Card({
  children,
  className = "",
  halo = false,
}: {
  children: ReactNode;
  className?: string;
  halo?: boolean;
}) {
  return <div className={`card fade-in ${halo ? "halo" : ""} ${className}`}>{children}</div>;
}

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-7">
      <h1 className="title-xl">{title}</h1>
      <p className="muted mt-2 text-sm sm:text-base">{subtitle}</p>
    </header>
  );
}

export function CardTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="text-[13px] font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]">{children}</h3>
      {action}
    </div>
  );
}

export function Ring({
  value,
  max = 20,
  size = 150,
  stroke = 12,
  color,
  children,
}: {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, max === 0 ? 0 : value / max));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color ?? "var(--accent)"}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset .5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Badge({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider"
      style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      {children}
    </span>
  );
}

export function ProgressBar({ value, max = 20, color }: { value: number; max?: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color ?? "var(--accent)" }}
      />
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="card fade-in w-full max-w-lg max-h-[85vh] overflow-auto"
        style={{ background: "var(--surface)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold">{title}</h3>
          <button className="btn !px-2.5 !py-2" onClick={onClose} aria-label="Fermer">
            <IconClose width={16} height={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative h-6 w-11 rounded-full transition-colors"
      style={{ background: on ? "var(--accent)" : "rgba(255,255,255,0.12)" }}
      aria-pressed={on}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
        style={{ left: on ? 22 : 2 }}
      />
    </button>
  );
}

/* ------------------------------- graphiques -------------------------------- */

export interface Point {
  label: string;
  value: number;
  hint?: string;
}

export function BarChart({ data, max = 20, height = 190 }: { data: Point[]; max?: number; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  if (!data.length) return <p className="muted text-sm">Aucune donnée.</p>;
  return (
    <div className="relative">
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => {
          const h = Math.max(3, (Math.max(0, d.value) / max) * (height - 26));
          return (
            <div
              key={`${d.label}-${i}`}
              className="flex flex-1 flex-col items-center justify-end gap-2"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {hover === i && (
                <div className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 rounded-2xl border border-white/10 bg-[var(--surface-2)] px-3 py-2 text-xs shadow-xl">
                  <b>{d.value.toFixed(2)}/20</b> · {d.hint ?? d.label}
                </div>
              )}
              <div
                className="w-full rounded-t-2xl rounded-b-lg transition-all"
                style={{
                  height: h,
                  background: hover === i ? "var(--accent)" : "var(--accent-soft)",
                  borderTop: "2px solid var(--accent)",
                }}
              />
              <span className="text-[10px] text-[var(--muted)]">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LineChart({
  data,
  height = 190,
  min,
  max,
  unit = "",
  digits = 2,
}: {
  data: Point[];
  height?: number;
  min?: number;
  max?: number;
  unit?: string;
  digits?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  if (data.length === 0) return <p className="muted text-sm">Aucune donnée.</p>;
  const values = data.map((d) => d.value);
  const lo = min ?? Math.min(...values) * 0.97;
  const hi = max ?? Math.max(...values) * 1.03;
  const span = hi - lo || 1;
  const w = 100;
  const pts = data.map((d, i) => {
    const x = data.length === 1 ? 50 : (i / (data.length - 1)) * w;
    const y = 100 - ((d.value - lo) / span) * 100;
    return { x, y, d };
  });
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const area = `${path} L${pts[pts.length - 1].x.toFixed(2)},100 L${pts[0].x.toFixed(2)},100 Z`;
  return (
    <div className="relative" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-[calc(100%-18px)] w-full">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.38" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#areaGrad)" />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hover === i ? 2.6 : 1.5}
            fill="var(--accent)"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </div>
      {hover !== null && (
        <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 rounded-2xl border border-white/10 bg-[var(--surface-2)] px-3 py-2 text-xs shadow-xl">
          <b>
            {data[hover].value.toFixed(digits)}
            {unit}
          </b>{" "}
          · {data[hover].hint ?? data[hover].label}
        </div>
      )}
      <div className="flex justify-between text-[10px] text-[var(--muted)]">
        <span>{data[0].label}</span>
        <span>{data[data.length - 1].label}</span>
      </div>
    </div>
  );
}

export function Sparkline({ data }: { data: number[] }) {
  if (!data.length) return null;
  const lo = Math.min(...data, 0);
  const hi = Math.max(...data, 1);
  const span = hi - lo || 1;
  const path = data
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i / Math.max(1, data.length - 1)) * 100},${100 - ((v - lo) / span) * 100}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-16 w-full">
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
