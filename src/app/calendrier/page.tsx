"use client";

import { useMemo, useState } from "react";
import { useZenith } from "@/components/store";
import { Card, Modal } from "@/components/ui";
import { IconPencil, IconPlus, IconTrash } from "@/components/icons";
import { live } from "@/lib/merge";
import { dayKey, eventsOnDay, frDate, minutesOf, monthGrid, parseKey } from "@/lib/calc";
import type { CalEvent } from "@/lib/types";

type View = "mois" | "agenda";

const DOW = ["L", "M", "M", "J", "V", "S", "D"];

interface Draft {
  id?: string;
  title: string;
  description: string;
  date: string;
  start: string;
  end: string;
  location: string;
  url: string;
  photoId: string | null;
  done: boolean;
}

function emptyDraft(date: string): Draft {
  return {
    title: "",
    description: "",
    date,
    start: "09:00",
    end: "10:00",
    location: "",
    url: "",
    photoId: null,
    done: false,
  };
}

export default function CalendrierPage() {
  const { state, addEvent, updateEvent, toggleEventDone, deleteEvent, ready } = useZenith();
  const [view, setView] = useState<View>("mois");
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => dayKey());
  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirm, setConfirm] = useState<CalEvent | null>(null);
  const [error, setError] = useState("");

  const events = live(state.events);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  // Index date -> événements : évite un filtrage O(n) par cellule de la grille.
  const byDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      const list = map.get(e.date);
      if (list) list.push(e);
      else map.set(e.date, [e]);
    }
    for (const list of map.values()) list.sort((a, b) => minutesOf(a.start) - minutesOf(b.start));
    return map;
  }, [events]);

  const grid = useMemo(() => monthGrid(year, month), [year, month]);
  const dayEvents = eventsOnDay(events, selected);
  const today = dayKey();

  const save = () => {
    if (!draft) return;
    if (!draft.title.trim()) return setError("Le titre est obligatoire.");
    if (minutesOf(draft.end) < minutesOf(draft.start)) return setError("L'heure de fin précède l'heure de début.");
    const payload = { ...draft, title: draft.title.trim() };
    if (draft.id) updateEvent(draft.id, payload);
    else addEvent(payload);
    setDraft(null);
    setError("");
  };

  if (!ready) return <p className="muted pt-10 text-sm">Chargement…</p>;

  return (
    <div className="w-full max-w-full space-y-6">
      <div className="flex w-full max-w-full flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Calendrier</h1>
        <div className="flex max-w-full flex-wrap items-center gap-2">
          <div className="no-scrollbar inline-flex max-w-full shrink-0 gap-1 overflow-x-auto rounded-full border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
            {(["mois", "agenda"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="min-h-[38px] shrink-0 whitespace-nowrap transform-gpu rounded-full px-4 text-sm font-semibold capitalize transition-colors"
                style={{
                  background: view === v ? "var(--accent)" : "transparent",
                  color: view === v ? "var(--accent-contrast)" : "var(--muted)",
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            className="btn btn-accent shrink-0 whitespace-nowrap"
            onClick={() => setDraft(emptyDraft(selected))}
          >
            <IconPlus width={16} height={16} />
            Événement
          </button>
        </div>
      </div>

      {view === "mois" ? (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <button className="btn !min-h-[38px] !px-3" onClick={() => setCursor(new Date(year, month - 1, 1))}>
              ◀
            </button>
            <h2 className="min-w-0 text-center text-base font-semibold capitalize">
              {cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
            </h2>
            <button className="btn !min-h-[38px] !px-3" onClick={() => setCursor(new Date(year, month + 1, 1))}>
              ▶
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center">
            {DOW.map((d, i) => (
              <span key={i} className="text-[11px] font-semibold text-[var(--muted)]">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {grid.map((key) => {
              const inMonth = parseKey(key).getMonth() === month;
              const list = byDate.get(key) ?? [];
              const isToday = key === today;
              const isSel = key === selected;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setSelected(key);
                    setView("agenda");
                  }}
                  className="flex min-h-[64px] transform-gpu flex-col items-center gap-1 rounded-xl border p-1.5 transition-colors"
                  style={{
                    borderColor: isSel ? "var(--accent)" : "transparent",
                    background: isToday ? "var(--accent-soft)" : "var(--surface-2)",
                    opacity: inMonth ? 1 : 0.35,
                  }}
                >
                  <span className={`text-xs ${isToday ? "font-bold" : ""}`}>{parseKey(key).getDate()}</span>
                  <span className="flex flex-wrap justify-center gap-0.5">
                    {list.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: e.done ? "var(--ok)" : "var(--accent)" }}
                      />
                    ))}
                  </span>
                  {list.length > 3 && <span className="text-[9px] text-[var(--muted)]">+{list.length - 3}</span>}
                </button>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="min-w-0 text-base font-semibold capitalize">{frDate(selected)}</h2>
              <p className="muted text-xs">
                {dayEvents.length} événement{dayEvents.length > 1 ? "s" : ""}
              </p>
            </div>
            <input
              className="input !w-auto max-w-full min-w-0 shrink-0"
              type="date"
              value={selected}
              onChange={(e) => e.target.value && setSelected(e.target.value)}
            />
          </div>

          {dayEvents.length === 0 ? (
            <p className="muted text-sm">Aucun événement ce jour.</p>
          ) : (
            <ul className="space-y-2">
              {dayEvents.map((e) => (
                <li key={e.id} className="flex gap-3 rounded-2xl bg-[var(--surface-2)] p-3">
                  <button
                    onClick={() => toggleEventDone(e.id)}
                    aria-label={e.done ? "Marquer non réalisé" : "Marquer réalisé"}
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-[11px] font-bold transition-colors"
                    style={{
                      borderColor: e.done ? "var(--ok)" : "var(--line)",
                      background: e.done ? "var(--ok)" : "transparent",
                      color: "#fff",
                    }}
                  >
                    {e.done ? "✓" : ""}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-xs tabular-nums text-[var(--accent-ink)]">
                        {e.start}–{e.end}
                      </span>
                      <span className={`truncate font-semibold ${e.done ? "line-through opacity-60" : ""}`}>
                        {e.title}
                      </span>
                    </div>
                    {e.description && <p className="muted mt-1 text-xs">{e.description}</p>}
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
                      {e.location && <span>📍 {e.location}</span>}
                      {e.url && (
                        <a href={e.url} target="_blank" rel="noopener noreferrer" className="link-open !text-xs">
                          Ouvrir le lien
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-start gap-1">
                    <button
                      onClick={() => setDraft({ ...e })}
                      aria-label="Modifier"
                      className="grid h-9 w-9 place-items-center rounded-full text-[var(--muted)] transition hover:text-[var(--text)]"
                    >
                      <IconPencil width={15} height={15} />
                    </button>
                    <button
                      onClick={() => setConfirm(e)}
                      aria-label="Supprimer"
                      className="grid h-9 w-9 place-items-center rounded-full text-[var(--muted)] transition hover:text-[var(--danger)]"
                    >
                      <IconTrash width={15} height={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* --------------------------- Formulaire complet --------------------------- */}
      <Modal
        open={!!draft}
        onClose={() => {
          setDraft(null);
          setError("");
        }}
        title={draft?.id ? "Modifier l'événement" : "Nouvel événement"}
      >
        {draft && (
          <div className="space-y-3">
            <input
              className="input"
              placeholder="Titre"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
            <textarea
              className="input"
              rows={2}
              placeholder="Description"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
            <div className="grid grid-cols-3 gap-2">
              <label className="col-span-3 sm:col-span-1">
                <span className="muted mb-1 block text-[11px] font-semibold uppercase">Date</span>
                <input
                  className="input"
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                />
              </label>
              <label>
                <span className="muted mb-1 block text-[11px] font-semibold uppercase">Début</span>
                <input
                  className="input"
                  type="time"
                  step={60}
                  value={draft.start}
                  onChange={(e) => setDraft({ ...draft, start: e.target.value })}
                />
              </label>
              <label>
                <span className="muted mb-1 block text-[11px] font-semibold uppercase">Fin</span>
                <input
                  className="input"
                  type="time"
                  step={60}
                  value={draft.end}
                  onChange={(e) => setDraft({ ...draft, end: e.target.value })}
                />
              </label>
            </div>
            <input
              className="input"
              placeholder="Lieu (adresse, salle…)"
              value={draft.location}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
            />
            <input
              className="input"
              type="url"
              placeholder="Lien (réunion, cours, ressource…)"
              value={draft.url}
              onChange={(e) => setDraft({ ...draft, url: e.target.value })}
            />

            {error && (
              <p className="text-xs" style={{ color: "var(--danger)" }}>
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              {draft.id && (
                <button
                  className="btn"
                  style={{ color: "var(--danger)" }}
                  onClick={() => {
                    const target = events.find((e) => e.id === draft.id);
                    if (target) setConfirm(target);
                  }}
                >
                  <IconTrash width={16} height={16} /> Supprimer
                </button>
              )}
              <button className="btn btn-accent" onClick={save}>
                Enregistrer
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ------------------------ Confirmation de suppression ---------------------- */}
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Supprimer cet événement ?">
        {confirm && (
          <div className="space-y-4">
            <div className="text-sm">
              <p className="font-semibold">{confirm.title}</p>
              <p className="muted mt-1 text-xs">
                {frDate(confirm.date)} · {confirm.start}–{confirm.end}
              </p>
              <p className="muted mt-2 text-xs">
                Cette action est définitive et retire l&apos;événement de tous vos appareils.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn" onClick={() => setConfirm(null)}>
                Annuler
              </button>
              <button
                className="btn"
                style={{ background: "var(--danger)", borderColor: "var(--danger)", color: "#fff" }}
                onClick={() => {
                  deleteEvent(confirm.id);
                  setConfirm(null);
                  setDraft(null);
                }}
              >
                <IconTrash width={16} height={16} /> Supprimer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
