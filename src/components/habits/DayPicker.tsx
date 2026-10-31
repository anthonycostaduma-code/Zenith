"use client";

import { ALL_DAYS, DAY_LABELS, WEEKDAYS, WEEKEND, type WeekDay } from "@/lib/types";

const PRESETS: { label: string; days: WeekDay[] }[] = [
  { label: "Tous les jours", days: ALL_DAYS },
  { label: "Semaine", days: WEEKDAYS },
  { label: "Week-end", days: WEEKEND },
];

function same(a: WeekDay[], b: WeekDay[]): boolean {
  return a.length === b.length && [...a].sort().every((d, i) => d === [...b].sort()[i]);
}

/** Sélecteur de jours ciblés : présélections + boutons L M M J V S D. */
export function DayPicker({
  value,
  onChange,
  compact = false,
}: {
  value: WeekDay[];
  onChange: (days: WeekDay[]) => void;
  compact?: boolean;
}) {
  const selected = value.length ? value : ALL_DAYS;

  return (
    <div className="space-y-2">
      {!compact && (
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange(p.days)}
              className="min-h-[32px] rounded-full px-3 text-[11px] font-semibold transition-colors"
              style={
                same(selected, p.days)
                  ? { background: "var(--accent)", color: "var(--accent-contrast)" }
                  : { background: "var(--surface-2)", color: "var(--muted)" }
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-1">
        {ALL_DAYS.map((d) => {
          const on = selected.includes(d);
          return (
            <button
              key={d}
              type="button"
              aria-pressed={on}
              aria-label={`Jour ${DAY_LABELS[d]}`}
              onClick={() => {
                const next = on ? selected.filter((x) => x !== d) : [...selected, d];
                // Ne jamais laisser une habitude sans aucun jour ciblé.
                onChange(next.length ? next : ALL_DAYS);
              }}
              className="grid h-9 flex-1 transform-gpu place-items-center rounded-xl text-xs font-bold transition-colors"
              style={{
                background: on ? "var(--accent)" : "var(--surface-2)",
                color: on ? "var(--accent-contrast)" : "var(--muted)",
              }}
            >
              {DAY_LABELS[d]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Résumé lisible des jours ciblés. */
export function daysSummary(days?: WeekDay[]): string {
  const list = days && days.length ? days : ALL_DAYS;
  if (same(list, ALL_DAYS)) return "Tous les jours";
  if (same(list, WEEKDAYS)) return "En semaine";
  if (same(list, WEEKEND)) return "Week-end";
  return ALL_DAYS.filter((d) => list.includes(d))
    .map((d) => DAY_LABELS[d])
    .join(" ");
}
