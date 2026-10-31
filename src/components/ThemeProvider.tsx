"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useZenith } from "./store";
import { applyTheme, resolveMode } from "@/lib/theme";
import type { ThemeMode } from "@/lib/types";

interface ThemeValue {
  mode: ThemeMode;
  resolved: "light" | "dark";
  accent: string;
  background: string | null;
  setMode: (mode: ThemeMode) => void;
  setBackground: (color: string | null) => void;
  setAccent: (accent: string, preset: string) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { state, setAccent, setThemeMode, setBackground } = useZenith();
  const theme = state.settings.theme;
  const mode: ThemeMode = theme.mode ?? "auto";
  const [resolved, setResolved] = useState<"light" | "dark">(() => resolveMode(mode));

  // En mode auto, on réévalue régulièrement pour basculer seul au coucher du soleil.
  useEffect(() => {
    const evaluate = () => setResolved(resolveMode(mode));
    evaluate();
    if (mode !== "auto") return;
    const id = window.setInterval(evaluate, 60_000);
    const onFocus = () => evaluate();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [mode]);

  useEffect(() => {
    applyTheme({ ...theme, mode }, resolved);
  }, [theme, mode, resolved]);

  const value = useMemo<ThemeValue>(
    () => ({
      mode,
      resolved,
      accent: theme.accent,
      background: theme.background ?? null,
      setMode: setThemeMode,
      setBackground,
      setAccent,
    }),
    [mode, resolved, theme.accent, theme.background, setThemeMode, setBackground, setAccent],
  );

  return (
    <ThemeContext.Provider value={value}>
      <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)]">{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme doit être utilisé dans ThemeProvider");
  return ctx;
}
