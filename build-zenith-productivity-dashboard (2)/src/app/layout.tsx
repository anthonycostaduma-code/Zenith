import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ZenithProvider } from "@/components/store";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "Zenith — Productivité · Études · Habitudes",
  description:
    "Zenith : tableau de bord personnel de productivité — tâches, habitudes, études, minuteur Pomodoro et suivi de poids, synchronisés sur tous vos appareils.",
};

export const viewport: Viewport = {
  themeColor: "#C6F000",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <ZenithProvider>
          <Shell>{children}</Shell>
        </ZenithProvider>
      </body>
    </html>
  );
}
