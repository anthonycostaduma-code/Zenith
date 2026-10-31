"use client";

import type { ReactNode } from "react";

/**
 * Transition de route (App Router).
 *
 * `template.tsx` est réinstancié à chaque navigation — contrairement à
 * `layout.tsx` — donc l'animation CSS se rejoue automatiquement, sans état
 * ni librairie supplémentaire.
 *
 * Choix de performance :
 *  - seuls `opacity` et `transform` sont animés (compositing GPU pur) ;
 *  - aucune propriété de flux (height/margin) => zéro layout shift ;
 *  - `will-change` est porté par la classe et retiré en fin d'animation
 *    via `animation-fill-mode: both` sur un élément éphémère.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="route-transition">{children}</div>;
}
