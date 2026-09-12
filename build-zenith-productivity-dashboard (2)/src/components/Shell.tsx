"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useZenith } from "./store";
import { THEME_PRESETS } from "@/lib/theme";
import {
  IconAverage,
  IconCloud,
  IconCollapse,
  IconCopy,
  IconDownload,
  IconFocus,
  IconHabits,
  IconHome,
  IconPalette,
  IconStudies,
  IconTasks,
  IconTracking,
  ZenithMark,
} from "./icons";
import { Modal } from "./ui";

const NAV = [
  { href: "/", label: "Accueil", Icon: IconHome },
  { href: "/taches", label: "Tâches", Icon: IconTasks },
  { href: "/habitudes", label: "Habitudes", Icon: IconHabits },
  { href: "/etudes", label: "Études", Icon: IconStudies },
  { href: "/focus", label: "Focus", Icon: IconFocus },
  { href: "/moyenne", label: "Moyenne", Icon: IconAverage },
  { href: "/suivi", label: "Suivi", Icon: IconTracking },
];

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      <aside
        className="sticky top-0 hidden h-dvh shrink-0 flex-col justify-between border-r border-white/5 bg-[var(--surface)]/70 p-4 backdrop-blur-xl transition-all duration-300 md:flex"
        style={{ width: collapsed ? 84 : 244 }}
      >
        <div>
          <Link href="/" className="mb-8 flex items-center gap-3 px-1">
            <ZenithMark size={38} />
            {!collapsed && (
              <div className="leading-tight">
                <div className="text-xl font-extrabold tracking-tight">Zenith</div>
                <div className="text-[10px] uppercase tracking-[0.13em] text-[var(--muted)]">
                  Productivité · Études · Habitudes
                </div>
              </div>
            )}
          </Link>
          <nav className="flex flex-col gap-1.5">
            {NAV.map(({ href, label, Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  title={label}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all"
                  style={{
                    background: active ? "var(--accent-soft)" : "transparent",
                    color: active ? "var(--accent)" : "var(--muted)",
                    boxShadow: active ? "inset 0 0 0 1px var(--accent-soft)" : "none",
                  }}
                >
                  <Icon width={20} height={20} />
                  {!collapsed && label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-1.5 border-t border-white/5 pt-3">
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
          <SyncDot />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <MobileBar onSync={() => setSyncOpen(true)} onTheme={() => setThemeOpen(true)} />
        <main className="mx-auto w-full max-w-[1320px] px-4 pb-28 pt-6 sm:px-7 md:pb-12">{children}</main>
        <MobileNav pathname={pathname} />
      </div>

      <SyncPanel open={syncOpen} onClose={() => setSyncOpen(false)} />
      <ThemePanel open={themeOpen} onClose={() => setThemeOpen(false)} />
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
      className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-[var(--muted)] transition-colors hover:bg-white/5 hover:text-white"
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
      return { text: "Échange…", color: "var(--accent)" };
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
    <div className="mt-1 flex items-center gap-2 px-3 py-1 text-[10px] uppercase tracking-wider text-[var(--muted)]">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
      {s.text}
    </div>
  );
}

function MobileBar({ onSync, onTheme }: { onSync: () => void; onTheme: () => void }) {
  const { status } = useZenith();
  const s = statusLabel(status);
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-[var(--bg)]/85 px-4 py-3 backdrop-blur-xl md:hidden">
      <Link href="/" className="flex items-center gap-2">
        <ZenithMark size={30} />
        <span className="text-lg font-extrabold">Zenith</span>
      </Link>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
        <button className="btn !px-3 !py-2" onClick={onTheme} aria-label="Apparence">
          <IconPalette width={18} height={18} />
        </button>
        <button className="btn !px-3 !py-2" onClick={onSync} aria-label="Synchroniser">
          <IconCloud width={18} height={18} />
        </button>
      </div>
    </div>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between gap-1 border-t border-white/5 bg-[var(--surface)]/95 px-2 pt-2 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      {NAV.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center gap-1 rounded-2xl py-1.5 text-[9px] font-bold"
            style={{ color: active ? "var(--accent)" : "var(--muted)", background: active ? "var(--accent-soft)" : "transparent" }}
          >
            <Icon width={19} height={19} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function SyncPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { code, status, lastSync, joinSpace, newSpace, syncNow, exportBackup } = useZenith();
  const [input, setInput] = useState("");
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const s = statusLabel(status);

  return (
    <Modal open={open} onClose={onClose} title="Synchronisation">
      <div className="space-y-5 text-sm">
        <div className="card-soft">
          <div className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-[var(--muted)]">
            Votre code d&apos;espace
          </div>
          <div className="flex items-center gap-2">
            <code
              className="flex-1 select-all rounded-2xl px-3 py-2.5 text-base font-extrabold tracking-wider"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              {code || "…"}
            </code>
            <button
              className="btn"
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
            Saisissez ce code sur vos autres appareils : toutes vos données (tâches, habitudes, notes, pesées, photos,
            thème) s&apos;y synchronisent automatiquement en quelques secondes.
          </p>
        </div>

        <div className="card-soft">
          <div className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-[var(--muted)]">
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
              className="btn btn-accent"
              onClick={async () => {
                const ok = await joinSpace(input);
                setMsg(ok ? "Espace rejoint, synchronisation en cours…" : "Code invalide ou réseau indisponible.");
                if (ok) setInput("");
              }}
            >
              Rejoindre
            </button>
          </div>
          {msg && <p className="mt-2 text-xs" style={{ color: "var(--accent)" }}>{msg}</p>}
        </div>

        <div className="card-soft flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 font-bold">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
              {s.text}
            </div>
            <p className="muted text-xs">
              {lastSync
                ? `Dernier échange à ${new Date(lastSync).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
                : "Aucun échange pour l'instant"}
            </p>
          </div>
          <button className="btn" onClick={syncNow}>
            Synchroniser
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={exportBackup}>
            <IconDownload width={16} height={16} />
            Exporter une sauvegarde
          </button>
          <button
            className="btn"
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
        <p className="muted text-xs">
          Hors-ligne, vos modifications sont conservées sur l&apos;appareil puis renvoyées automatiquement dès le retour
          du réseau.
        </p>
      </div>
    </Modal>
  );
}

function ThemePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, setAccent, updateSettings } = useZenith();
  const accent = state.settings.theme.accent;
  return (
    <Modal open={open} onClose={onClose} title="Apparence">
      <div className="space-y-5 text-sm">
        <div>
          <div className="mb-3 text-[11px] font-extrabold uppercase tracking-widest text-[var(--muted)]">Presets</div>
          <div className="flex flex-wrap gap-2">
            {THEME_PRESETS.map((p) => (
              <button
                key={p.id}
                className="pill"
                style={
                  state.settings.theme.preset === p.id
                    ? { background: p.accent, borderColor: p.accent, color: "#10121a" }
                    : undefined
                }
                onClick={() => setAccent(p.accent, p.id)}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.accent }} />
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="card-soft flex items-center justify-between">
          <div>
            <div className="font-bold">Couleur personnalisée</div>
            <p className="muted text-xs">Applique instantanément la teinte à toute l&apos;interface.</p>
          </div>
          <input type="color" value={accent} onChange={(e) => setAccent(e.target.value, "perso")} />
        </div>
        <div className="card-soft">
          <div className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-[var(--muted)]">Prénom</div>
          <input
            className="input"
            value={state.settings.userName}
            onChange={(e) => updateSettings({ userName: e.target.value })}
            placeholder="Votre prénom"
          />
        </div>
      </div>
    </Modal>
  );
}
