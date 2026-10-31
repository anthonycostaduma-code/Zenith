"use client";

import { useMemo, type ReactNode } from "react";
import { useZenith } from "@/components/store";
import { GlassCard } from "@/components/ui/GlassCard";
import { normalizeHome } from "@/lib/merge";
import { IconChevron, IconClose, IconPlus } from "@/components/icons";

export type WidgetSize = "large" | "medium" | "small";

export interface WidgetDef {
  id: string;
  /** Nom affiché dans le panneau « Modifier l'accueil ». */
  label: string;
  size: WidgetSize;
  render: () => ReactNode;
}

/** 4x2 → pleine largeur · 2x2 → demi · 1x1 → quart (2 colonnes sur mobile). */
const SPAN: Record<WidgetSize, string> = {
  large: "col-span-2 md:col-span-4",
  medium: "col-span-2 md:col-span-2",
  small: "col-span-1 md:col-span-1",
};

interface Props {
  widgets: WidgetDef[];
  editing: boolean;
  onToggleEditing: () => void;
}

export function WidgetGrid({ widgets, editing, onToggleEditing }: Props) {
  const { state, toggleHomeWidget, moveHomeWidget, resetHomeLayout } = useZenith();

  // L'ordre vient du store (persisté en localStorage + synchronisé entre appareils).
  const layout = useMemo(() => normalizeHome(state.settings.home), [state.settings.home]);
  const byId = useMemo(() => new Map(widgets.map((w) => [w.id, w])), [widgets]);
  const ordered = layout.map((item) => ({ item, def: byId.get(item.id) })).filter((x) => !!x.def);
  const visible = ordered.filter((x) => x.item.enabled);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end">
        <button
          onClick={onToggleEditing}
          className="min-h-[38px] transform-gpu rounded-full border border-zinc-200 bg-white px-4 text-xs font-semibold transition-transform active:scale-95 dark:border-zinc-800 dark:bg-zinc-900"
          style={editing ? { background: "var(--accent)", color: "var(--accent-contrast)" } : undefined}
        >
          {editing ? "Terminé" : "Modifier l'accueil"}
        </button>
      </div>

      {editing && (
        <GlassCard className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold">Personnaliser la grille</h2>
              <p className="muted text-xs">Affichez, masquez et réordonnez vos widgets.</p>
            </div>
            <button className="link-open shrink-0" onClick={resetHomeLayout}>
              Réinitialiser
            </button>
          </div>

          <ul className="space-y-2">
            {ordered.map(({ item, def }, index) => (
              <li
                key={item.id}
                className="flex items-center gap-2 rounded-2xl bg-[var(--glass-solid)] px-3 py-2"
              >
                <div className="flex flex-col">
                  <button
                    onClick={() => moveHomeWidget(item.id, -1)}
                    disabled={index === 0}
                    aria-label={`Monter ${def!.label}`}
                    className="grid h-6 w-7 place-items-center rounded-lg text-[var(--muted)] transition disabled:opacity-25"
                  >
                    <IconChevron width={14} height={14} style={{ transform: "rotate(180deg)" }} />
                  </button>
                  <button
                    onClick={() => moveHomeWidget(item.id, 1)}
                    disabled={index === ordered.length - 1}
                    aria-label={`Descendre ${def!.label}`}
                    className="grid h-6 w-7 place-items-center rounded-lg text-[var(--muted)] transition disabled:opacity-25"
                  >
                    <IconChevron width={14} height={14} />
                  </button>
                </div>

                <span className="flex-1 text-sm font-medium">{def!.label}</span>
                <span className="muted hidden text-[10px] uppercase tracking-wider sm:inline">
                  {def!.size === "large" ? "4×2" : def!.size === "medium" ? "2×2" : "1×1"}
                </span>

                <button
                  onClick={() => toggleHomeWidget(item.id)}
                  role="switch"
                  aria-checked={item.enabled}
                  aria-label={`Afficher ${def!.label}`}
                  className="relative h-7 w-12 shrink-0 rounded-full transition-colors"
                  style={{ background: item.enabled ? "var(--accent)" : "var(--surface-2)" }}
                >
                  <span
                    className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all"
                    style={{ left: item.enabled ? 22 : 2 }}
                  />
                </button>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      {visible.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="muted text-sm">Aucun widget affiché.</p>
          <button className="btn mt-4" onClick={onToggleEditing}>
            <IconPlus width={16} height={16} /> Ajouter des widgets
          </button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {visible.map(({ item, def }) => (
            <div key={item.id} className={`${SPAN[def!.size]} relative`}>
              {editing && (
                <button
                  onClick={() => toggleHomeWidget(item.id)}
                  aria-label={`Masquer ${def!.label}`}
                  className="absolute -left-1.5 -top-1.5 z-20 grid h-7 w-7 place-items-center rounded-full border border-white/20 bg-[var(--surface)] text-[var(--danger)] shadow-lg"
                >
                  <IconClose width={14} height={14} />
                </button>
              )}
              <div className={editing ? "pointer-events-none animate-[wiggle_0.45s_ease-in-out_infinite] transform-gpu" : "h-full"}>
                {def!.render()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
