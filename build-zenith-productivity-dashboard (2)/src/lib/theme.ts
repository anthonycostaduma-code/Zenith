export const THEME_PRESETS: { id: string; label: string; accent: string }[] = [
  { id: "lime-nuit", label: "Lime nuit", accent: "#C6F000" },
  { id: "bleu-ocean", label: "Bleu océan", accent: "#4FA8FF" },
  { id: "violet-aurore", label: "Violet aurore", accent: "#B07CFF" },
  { id: "corail-chaud", label: "Corail chaud", accent: "#FF7A5C" },
  { id: "menthe", label: "Menthe", accent: "#4BE3A2" },
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const num = parseInt(h || "C6F000", 16);
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

/** Applique la palette complète à partir d'une seule couleur d'accent. */
export function applyAccent(accent: string) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const contrast = luminance(accent) > 0.45 ? "#10121a" : "#ffffff";
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--accent-soft", rgba(accent, 0.14));
  root.style.setProperty("--accent-glow", rgba(accent, 0.32));
  root.style.setProperty("--accent-contrast", contrast);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", accent);
}
