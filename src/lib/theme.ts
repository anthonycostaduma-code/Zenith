import type { ThemeMode, ThemeState } from "./types";

export const THEME_PRESETS: { id: string; label: string; accent: string }[] = [
  { id: "lime-nuit", label: "Lime nuit", accent: "#C6F000" },
  { id: "bleu-ocean", label: "Bleu océan", accent: "#4FA8FF" },
  { id: "violet-aurore", label: "Violet aurore", accent: "#B07CFF" },
  { id: "corail-chaud", label: "Corail chaud", accent: "#FF7A5C" },
  { id: "menthe", label: "Menthe", accent: "#4BE3A2" },
];

/** Fonds proposés dans le panneau Apparence (null = fond par défaut du mode). */
export const BACKGROUND_SWATCHES: { id: string; label: string; light: string; dark: string }[] = [
  { id: "defaut", label: "Par défaut", light: "#F7F7F4", dark: "#14151C" },
  { id: "papier", label: "Papier", light: "#FBF8F1", dark: "#1A1813" },
  { id: "brume", label: "Brume", light: "#F2F5F8", dark: "#12161C" },
  { id: "sauge", label: "Sauge", light: "#F2F5F0", dark: "#141A16" },
  { id: "encre", label: "Encre", light: "#EFF0F6", dark: "#111220" },
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let h = (hex || "").replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) h = "C6F000";
  const num = parseInt(h, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** amount < 0 assombrit, amount > 0 éclaircit. */
export function shade(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const mix = (c: number) =>
    Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount)
      .toString(16)
      .padStart(2, "0");
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

/** Mode effectif : "auto" = sombre le soir/nuit (>=20h ou <7h), clair la journée. */
export function resolveMode(mode: ThemeMode, now: Date = new Date()): "light" | "dark" {
  if (mode === "light" || mode === "dark") return mode;
  const h = now.getHours();
  return h >= 20 || h < 7 ? "dark" : "light";
}

/** Applique toute la palette (accent + mode + fond personnalisé) sur :root. */
export function applyTheme(theme: ThemeState, resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const accent = theme.accent || "#C6F000";

  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;

  root.style.setProperty("--accent", accent);
  root.style.setProperty("--accent-soft", rgba(accent, resolved === "light" ? 0.16 : 0.14));
  root.style.setProperty("--accent-glow", rgba(accent, resolved === "light" ? 0.22 : 0.32));
  root.style.setProperty("--accent-contrast", luminance(accent) > 0.45 ? "#10121a" : "#ffffff");

  // Sur fond clair, un accent très lumineux devient illisible en texte : on l'assombrit.
  const needsInk = resolved === "light" && luminance(accent) > 0.45;
  root.style.setProperty("--accent-ink", needsInk ? shade(accent, -0.55) : accent);

  if (theme.background) root.style.setProperty("--bg-custom", theme.background);
  else root.style.removeProperty("--bg-custom");

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme.background || (resolved === "light" ? "#F7F7F4" : "#14151C"));
}
