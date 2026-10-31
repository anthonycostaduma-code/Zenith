"use client";

import { useMemo, useState } from "react";
import { useZenith } from "@/components/store";
import { WidgetGrid, type WidgetDef } from "@/components/home/WidgetGrid";
import {
  AgendaWidget,
  ClockWidget,
  FocusWidget,
  HabitsWidget,
  ScoreWidget,
  ShortcutsWidget,
  TasksWidget,
} from "@/components/home/widgets";

export default function HomePage() {
  const { ready } = useZenith();
  const [editing, setEditing] = useState(false);

  // Catalogue des widgets : l'ordre réel vient du store (grille personnalisable).
  const widgets = useMemo<WidgetDef[]>(
    () => [
      { id: "clock", label: "Horloge & Rituel", size: "large", render: () => <ClockWidget /> },
      { id: "shortcuts", label: "Raccourcis", size: "large", render: () => <ShortcutsWidget /> },
      { id: "tasks", label: "Tâches urgentes", size: "medium", render: () => <TasksWidget /> },
      { id: "habits", label: "Habitudes du jour", size: "medium", render: () => <HabitsWidget /> },
      { id: "agenda", label: "Prochains événements", size: "medium", render: () => <AgendaWidget /> },
      { id: "score", label: "Score productivité", size: "small", render: () => <ScoreWidget /> },
      { id: "focus", label: "Focus du jour", size: "small", render: () => <FocusWidget /> },
    ],
    [],
  );

  if (!ready) return <p className="muted pt-10 text-sm">Chargement…</p>;

  return <WidgetGrid widgets={widgets} editing={editing} onToggleEditing={() => setEditing((e) => !e)} />;
}
