"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useZenith } from "./store";
import { useTheme } from "./ThemeProvider";
import { BACKGROUND_SWATCHES, THEME_PRESETS } from "@/lib/theme";
import type { ThemeMode } from "@/lib/types";
import {
  IconAverage,
  IconCalendar,
  IconCloud,
  IconCollapse,
  IconCopy,
  IconDownload,
  IconHome,
  IconPalette,
  IconStudies,
  IconTasks,
  ZenithMark,
} from "./icons";
import { Modal } from "./ui";

/** Les 4 piliers de Zenith. */
const NAV = [
  { href: "/", label: "Accueil", Icon: IconHome, hint: "Tableau de bord" },
  { href: "/quotidien", label: "Quotidien", Icon: IconTasks, hint: "Tâches · Habitudes" },
  { href: "/academie", label: "Académie", Icon: IconStudies, hint: "Études · Focus" },
  { href: "/calendrier", label: "Agenda", Icon: IconCalendar, hint: "Calendrier · Événements" },
  { href: "/progression", label: "Progression", Icon: IconAverage, hint: "Moyenne · Suivi" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      {/* ---------------- Sidebar fixe (PC) ---------------- */}
      <aside
        className={`sticky top-0 hidden h-dvh shrink-0 flex-col justify-between border-r border-zinc-200 bg-zinc-50 px-3 py-4 transition-[width] duration-300 md:flex dark:border-zinc-800 dark:bg-zinc-950 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div>
          <Link href="/" className="mb-8 flex min-h-[44px] items-center gap-3 px-2">
            <ZenithMark size={34} />
            {!collapsed && <span className="text-xl font-bold tracking-tight">Zenith</span>}
          </Link>

          <nav className="flex flex-col gap-1">
            {NAV.map(({ href, label, Icon, hint }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  title={hint}
                  className={`flex min-h-[44px] transform-gpu items-center gap-3 rounded-2xl px-3 text-sm transition-all duration-200 hover:translate-x-0.5 ${
                    collapsed ? "justify-center" : ""
                  }`}
                  style={{
                    background: active ? "var(--accent-soft)" : "transparent",
                    color: active ? "var(--accent-ink)" : "var(--muted)",
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                    <Icon width={20} height={20} />
                  </span>
                  {!collapsed && label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-1">
          <SideButton collapsed={collapsed} label="Synchroniser" onClick={() => setSyncOpen(true)}>
            <IconCloud width={20} height={20} />
          </SideButton>
          <SideButton collapsed={collapsed} label="Apparence" onClick={() => setThemeOpen(true)}>
            <IconPalette width={20} height={20} />
          </SideButton>
          <SideButton collapsed={collapsed} label="Réduire" onClick={() => setCollapsed((c) => !c)}>
            <IconCollapse
              width={20}
              height={20}
              style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform .3s" }}
            />
          </SideButton>
          {!collapsed && <SyncDot />}
        </div>
      </aside>

      {/* ---------------- Contenu ---------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileBar onSync={() => setSyncOpen(true)} onTheme={() => setThemeOpen(true)} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-32 pt-6 sm:px-8 md:pb-16 md:pt-10">{children}</main>
        <MobileNav pathname={pathname} />
      </div>

      <SyncPanel open={syncOpen} onClose={() => setSyncOpen(false)} />
      <AppearancePanel open={themeOpen} onClose={() => setThemeOpen(false)} />
    </div>
  );
}

function SideButton({
  children,
  label,
  collapsed,
  onClick,
}: {
  children: ReactNode;
  label: string;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex min-h-[44px] items-center gap-3 rounded-2xl px-3 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)] ${
        collapsed ? "justify-center" : ""
      }`}
    >
      {children}
      {!collapsed && label}
    </button>
  );
}

function statusLabel(status: string): { text: string; color: string } {
  switch (status) {
    case "synced":
      return { text: "Synchronisé", color: "var(--ok)" };
    case "pending":
      return { text: "En attente", color: "var(--warn)" };
    case "syncing":
      return { text: "Échange…", color: "var(--accent-ink)" };
    case "offline":
      return { text: "Hors-ligne", color: "var(--danger)" };
    default:
      return { text: "Démarrage", color: "var(--muted)" };
  }
}

function SyncDot() {
  const { status } = useZenith();
  const s = statusLabel(status);
  return (
    <div className="flex items-center gap-2 px-3 py-2 text-[10px] uppercase tracking-wider text-[var(--muted)]">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: s.color }} />
      {s.text}
    </div>
  );
}

function MobileBar({ onSync, onTheme }: { onSync: () => void; onTheme: () => void }) {
  const { status } = useZenith();
  const s = statusLabel(status);
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-zinc-50/95 px-5 py-3 md:hidden dark:border-zinc-800 dark:bg-zinc-950/95">
      <Link href="/" className="flex items-center gap-2">
        <ZenithMark size={26} />
        <span className="text-base font-bold">Zenith</span>
      </Link>
      <div className="flex items-center gap-1">
        <span className="mr-1 h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
        <button
          className="grid h-11 w-11 place-items-center rounded-full text-[var(--muted)]"
          onClick={onTheme}
          aria-label="Apparence"
        >
          <IconPalette width={19} height={19} />
        </button>
        <button
          className="grid h-11 w-11 place-items-center rounded-full text-[var(--muted)]"
          onClick={onSync}
          aria-label="Synchroniser"
        >
          <IconCloud width={19} height={19} />
        </button>
      </div>
    </div>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch gap-1 border-t border-zinc-200 bg-white px-2 pt-2 pb-[env(safe-area-inset-bottom)] md:hidden dark:border-zinc-800 dark:bg-zinc-900">
      {NAV.map(({ href, label, Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className="flex min-h-[48px] flex-1 transform-gpu flex-col items-center justify-center gap-1 rounded-2xl py-1 text-[10px] font-semibold transition-all duration-200 active:scale-95"
            style={{
              color: active ? "var(--accent-ink)" : "var(--muted)",
              background: active ? "var(--accent-soft)" : "transparent",
            }}
          >
            <Icon width={20} height={20} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/* ------------------------------ Synchronisation ----------------------------- */

function SyncPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { code, status, lastSync, joinSpace, newSpace, syncNow, exportBackup } = useZenith();
  const [input, setInput] = useState("");
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const s = statusLabel(status);

  return (
    <Modal open={open} onClose={onClose} title="Synchronisation">
      <div className="space-y-5 text-sm">
        <div>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">
            Votre code d&apos;espace
          </div>
          <div className="flex items-center gap-2">
            <code
              className="flex-1 select-all rounded-2xl px-3 py-3 text-base font-bold tracking-wider"
              style={{ background: "var(--accent-soft)", color: "var(--accent-ink)" }}
            >
              {code || "…"}
            </code>
            <button
              className="btn min-h-[44px]"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(code);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                } catch {
                  setMsg("Copie impossible, sélectionnez le code manuellement.");
                }
              }}
            >
              <IconCopy width={16} height={16} />
              {copied ? "Copié" : "Copier"}
            </button>
          </div>
          <p className="muted mt-3 text-xs">
            Saisissez ce code sur vos autres appareils pour retrouver toutes vos données automatiquement.
          </p>
        </div>

        <div>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">
            Rejoindre un espace existant
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="input"
              placeholder="zen-xxxx-xxxx-xxxx"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              className="btn btn-accent min-h-[44px]"
              onClick={async () => {
                const ok = await joinSpace(input);
                setMsg(ok ? "Espace rejoint, synchronisation en cours…" : "Code invalide ou réseau indisponible.");
                if (ok) setInput("");
              }}
            >
              Rejoindre
            </button>
          </div>
          {msg && (
            <p className="mt-2 text-xs" style={{ color: "var(--accent-ink)" }}>
              {msg}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--line)] pt-4">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.text}
            </div>
            <p className="muted text-xs">
              {lastSync
                ? `Dernier échange à ${new Date(lastSync).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
                : "Aucun échange pour l'instant"}
            </p>
          </div>
          <button className="btn min-h-[44px]" onClick={syncNow}>
            Synchroniser
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="btn min-h-[44px]" onClick={exportBackup}>
            <IconDownload width={16} height={16} />
            Exporter une sauvegarde
          </button>
          <button
            className="btn min-h-[44px]"
            style={{ color: "var(--danger)" }}
            onClick={async () => {
              if (confirm("Créer un nouvel espace vierge ? Les données actuelles resteront accessibles via l'ancien code.")) {
                await newSpace();
                setMsg("Nouvel espace créé.");
              }
            }}
          >
            Nouveau code
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* --------------------------------- Apparence -------------------------------- */

const MODES: { id: ThemeMode; label: string; hint: string }[] = [
  { id: "auto", label: "Auto", hint: "Clair le jour, sombre dès 20h" },
  { id: "light", label: "Clair", hint: "Toujours clair" },
  { id: "dark", label: "Sombre", hint: "Toujours sombre" },
];

function AppearancePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, updateSettings } = useZenith();
  const { mode, resolved, accent, background, setMode, setBackground, setAccent } = useTheme();

  return (
    <Modal open={open} onClose={onClose} title="Apparence">
      <div className="space-y-6 text-sm">
        {/* Mode jour / soir */}
        <section>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">Mode d&apos;affichage</div>
          <div className="grid grid-cols-3 gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className="min-h-[44px] rounded-2xl px-2 py-2 text-xs font-bold transition-colors"
                style={{
                  background: mode === m.id ? "var(--accent)" : "var(--surface-2)",
                  color: mode === m.id ? "var(--accent-contrast)" : "var(--muted)",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="muted mt-2 text-xs">
            {MODES.find((m) => m.id === mode)?.hint}
            {mode === "auto" && ` · actuellement ${resolved === "dark" ? "sombre" : "clair"}`}
          </p>
        </section>

        {/* Couleur de fond personnalisée */}
        <section>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">
            Couleur d&apos;arrière-plan
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setBackground(null)}
              className="min-h-[44px] rounded-2xl px-3 text-xs font-bold"
              style={{
                background: background === null ? "var(--accent)" : "var(--surface-2)",
                color: background === null ? "var(--accent-contrast)" : "var(--muted)",
              }}
            >
              Par défaut
            </button>
            {BACKGROUND_SWATCHES.slice(1).map((b) => {
              const value = resolved === "dark" ? b.dark : b.light;
              return (
                <button
                  key={b.id}
                  onClick={() => setBackground(value)}
                  title={b.label}
                  className="h-11 w-11 rounded-2xl border-2 transition-transform hover:scale-105"
                  style={{
                    background: value,
                    borderColor: background === value ? "var(--accent)" : "var(--line)",
                  }}
                />
              );
            })}
            <input
              type="color"
              value={background ?? (resolved === "dark" ? "#14151C" : "#F7F7F4")}
              onChange={(e) => setBackground(e.target.value)}
              aria-label="Couleur de fond personnalisée"
            />
          </div>
        </section>

        {/* Accent */}
        <section>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">Couleur d&apos;accent</div>
          <div className="flex flex-wrap items-center gap-2">
            {THEME_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setAccent(p.accent, p.id)}
                title={p.label}
                className="h-11 w-11 rounded-2xl border-2 transition-transform hover:scale-105"
                style={{ background: p.accent, borderColor: accent === p.accent ? "var(--text)" : "transparent" }}
              />
            ))}
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value, "perso")}
              aria-label="Couleur d'accent personnalisée"
            />
          </div>
        </section>

        {/* Prénom */}
        <section>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">Prénom</div>
          <input
            className="input"
            value={state.settings.userName}
            onChange={(e) => updateSettings({ userName: e.target.value })}
            placeholder="Votre prénom"
          />
        </section>
      </div>
    </Modal>
  );
}
