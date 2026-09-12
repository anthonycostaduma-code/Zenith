"use client";

import { useState } from "react";
import { useZenith } from "@/components/store";
import { Badge, Card, CardTitle, Modal, PageHeader } from "@/components/ui";
import { IconFlame, IconPlus, IconTrash } from "@/components/icons";
import { live } from "@/lib/merge";
import { dayKey, habitStreak, habitWeekRate, lastNDays, parseKey } from "@/lib/calc";

const SWATCHES = ["#C6F000", "#FF6B8B", "#FFB020", "#4FA8FF", "#B07CFF", "#4BE3A2", "#FF7A5C", "#59E0E6"];

export default function HabitsPage() {
  const {
    state,
    addHabit,
    deleteHabit,
    toggleHabitDay,
    addHabitCategory,
    updateHabitCategory,
    deleteHabitCategory,
  } = useZenith();
  const habits = live(state.habits);
  const cats = live(state.habitCategories);

  const [name, setName] = useState("");
  const [cat, setCat] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(SWATCHES[3]);

  const today = dayKey();
  const week = lastNDays(7);
  const catOf = (id: string) => cats.find((c) => c.id === id);

  const submit = () => {
    const value = name.trim();
    if (!value) return;
    addHabit(value, cat);
    setName("");
  };

  return (
    <div>
      <PageHeader
        title="Habitudes."
        subtitle={`${habits.length} actives · ${habitWeekRate(state.habits)}% accompli sur 7 jours`}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <Card halo className="h-fit">
          <CardTitle>+ Nouvelle habitude</CardTitle>
          <p className="muted mb-3 text-sm">Petite, quotidienne, non négociable</p>
          <input
            className="input mb-3"
            placeholder="ex : Sport le matin, Lire 20 pages..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <div className="mb-4">
            <div className="muted mb-2 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-widest">
              Catégorie
              <button className="link-open" onClick={() => setManageOpen(true)}>
                Gérer les catégories
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {cats.map((c) => (
                <button
                  key={c.id}
                  className="pill"
                  style={cat === c.id ? { background: c.color, borderColor: c.color, color: "#10121a" } : undefined}
                  onClick={() => setCat(cat === c.id ? "" : c.id)}
                >
                  {c.name}
                </button>
              ))}
              <button className="pill" onClick={() => setNewOpen(true)}>
                <IconPlus width={13} height={13} /> Nouvelle catégorie
              </button>
            </div>
          </div>
          <button className="btn btn-accent w-full" onClick={submit}>
            Ajouter
          </button>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          {habits.length === 0 && (
            <Card className="sm:col-span-2">
              <p className="muted text-sm">Aucune habitude pour le moment. Commencez par une seule, très simple.</p>
            </Card>
          )}
          {habits.map((h) => {
            const history = h.history ?? [];
            const doneToday = history.includes(today);
            const weekCount = week.filter((d) => history.includes(d)).length;
            const streak = habitStreak(h);
            const c = catOf(h.category);
            return (
              <Card key={h.id}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold leading-tight">{h.name}</h3>
                    {c && (
                      <div className="mt-1">
                        <Badge color={c.color}>{c.name}</Badge>
                      </div>
                    )}
                  </div>
                  <button style={{ color: "var(--danger)" }} onClick={() => deleteHabit(h.id)} aria-label="Supprimer">
                    <IconTrash width={17} height={17} />
                  </button>
                </div>

                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="muted">{weekCount}/7 cette semaine</span>
                  <span className="flex items-center gap-1.5 font-bold" style={{ color: "var(--accent)" }}>
                    <IconFlame width={16} height={16} />
                    {streak} jour{streak > 1 ? "s" : ""}
                    <span className="muted font-normal">· Série en cours</span>
                  </span>
                </div>

                <div className="mb-4 flex justify-between gap-1.5">
                  {week.map((d) => {
                    const ok = history.includes(d);
                    return (
                      <button
                        key={d}
                        onClick={() => toggleHabitDay(h.id, d)}
                        className="grid h-9 flex-1 place-items-center rounded-full border text-[11px] font-black transition-all"
                        style={{
                          background: ok ? "var(--accent)" : "rgba(255,255,255,0.03)",
                          borderColor: ok ? "var(--accent)" : "var(--line)",
                          color: ok ? "var(--accent-contrast)" : "var(--muted)",
                        }}
                        title={d}
                      >
                        {ok ? "✓" : parseKey(d).toLocaleDateString("fr-FR", { weekday: "narrow" }).toUpperCase()}
                      </button>
                    );
                  })}
                </div>

                <button
                  className={`btn w-full ${doneToday ? "btn-accent" : ""}`}
                  onClick={() => toggleHabitDay(h.id)}
                >
                  {doneToday ? "Faite aujourd'hui" : "Valider pour aujourd'hui"}
                </button>
              </Card>
            );
          })}
        </div>
      </div>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Nouvelle catégorie">
        <input
          className="input mb-3"
          placeholder="Nom de la catégorie"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {SWATCHES.map((c) => (
            <button
              key={c}
              onClick={() => setNewColor(c)}
              className="h-8 w-8 rounded-full border-2"
              style={{ background: c, borderColor: newColor === c ? "#fff" : "transparent" }}
            />
          ))}
          <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} />
        </div>
        <button
          className="btn btn-accent w-full"
          onClick={() => {
            if (!newName.trim()) return;
            addHabitCategory(newName.trim(), newColor);
            setNewName("");
            setNewOpen(false);
          }}
        >
          Créer
        </button>
      </Modal>

      <Modal open={manageOpen} onClose={() => setManageOpen(false)} title="Gérer les catégories">
        <ul className="space-y-2">
          {cats.map((c) => (
            <li key={c.id} className="card-soft flex items-center gap-2">
              <input
                type="color"
                value={c.color}
                onChange={(e) => updateHabitCategory(c.id, { color: e.target.value })}
              />
              <input
                className="input"
                value={c.name}
                onChange={(e) => updateHabitCategory(c.id, { name: e.target.value })}
              />
              <button
                className="btn !px-3"
                style={{ color: "var(--danger)" }}
                onClick={() => deleteHabitCategory(c.id)}
              >
                <IconTrash width={16} height={16} />
              </button>
            </li>
          ))}
        </ul>
        <button className="btn mt-3 w-full" onClick={() => setNewOpen(true)}>
          <IconPlus width={16} height={16} /> Ajouter une catégorie
        </button>
      </Modal>
    </div>
  );
}
