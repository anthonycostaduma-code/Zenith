import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ZenithProvider } from "@/components/store";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Zenith — Productivité · Études · Habitudes",
  description:
    "Zenith : tableau de bord personnel de productivité — habitudes, tâches, études, focus et suivi, synchronisés sur tous vos appareils.",
};

export const viewport: Viewport = {
  themeColor: "#14151C",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" data-theme="dark" suppressHydrationWarning>
      <body className="antialiased">
        <ZenithProvider>
          <ThemeProvider>
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </ZenithProvider>
      </body>
    </html>
  );
}
