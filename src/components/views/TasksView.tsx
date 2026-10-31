"use client";

import { useMemo, useState } from "react";
import { useZenith } from "@/components/store";
import { Badge, Card, CardTitle, Modal, PageHeader } from "@/components/ui";
import { IconPlus, IconTrash } from "@/components/icons";
import { live } from "@/lib/merge";
import { PRIORITY_LABEL } from "@/lib/calc";
import type { Priority, Task } from "@/lib/types";

const PRIORITY_COLOR: Record<Priority, string> = {
  haute: "#FF5C7A",
  moyenne: "#FFB020",
  basse: "#8FD9B6",
};
const PRIORITIES: Priority[] = ["haute", "moyenne", "basse"];
const SWATCHES = ["#C6F000", "#FF6B8B", "#FFB020", "#4FA8FF", "#B07CFF", "#4BE3A2", "#FF7A5C", "#59E0E6"];

export default function TasksView() {
  const { state, addTask, toggleTask, deleteTask, updateTask, archiveDone, addTag, updateTag, deleteTag } = useZenith();
  const tags = live(state.tags);
  const tasks = live(state.tasks);

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("moyenne");
  const [tag, setTag] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "done">("all");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [prioFilter, setPrioFilter] = useState<Priority | "all">("all");
  const [showArchived, setShowArchived] = useState(false);
  const [newTagOpen, setNewTagOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(SWATCHES[0]);
  const [editing, setEditing] = useState<Task | null>(null);

  const active = tasks.filter((t) => !t.archived);
  const archived = tasks.filter((t) => t.archived);

  const filtered = useMemo(() => {
    return active.filter((t) => {
      if (statusFilter === "open" && t.done) return false;
      if (statusFilter === "done" && !t.done) return false;
      if (tagFilter.length && !tagFilter.includes(t.tag)) return false;
      if (prioFilter !== "all" && t.priority !== prioFilter) return false;
      return true;
    });
  }, [active, statusFilter, tagFilter, prioFilter]);

  const open = filtered.filter((t) => !t.done);
  const done = filtered.filter((t) => t.done);
  const tagOf = (id: string) => tags.find((t) => t.id === id);

  const submit = () => {
    const value = title.trim();
    if (!value) return;
    addTask(value, priority, tag);
    setTitle("");
  };

  return (
    <div>
      <PageHeader
        title="Tâches."
        subtitle={`${active.filter((t) => !t.done).length} en cours · ${active.filter((t) => t.done).length} terminées · ${archived.length} archivées`}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <Card halo className="h-fit">
          <CardTitle>+ Nouvelle tâche</CardTitle>
          <input
            className="input mb-3"
            placeholder="Qu'est-ce qui doit être fait ?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <div className="mb-3">
            <div className="muted mb-2 text-[11px] font-extrabold uppercase tracking-widest">Priorité</div>
            {/* 3 colonnes égales : les trois boutons occupent exactement la largeur. */}
            <div className="grid w-full grid-cols-3 gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  className="pill w-full min-w-0 justify-center !px-2"
                  style={
                    priority === p
                      ? { background: PRIORITY_COLOR[p], borderColor: PRIORITY_COLOR[p], color: "#10121a" }
                      : undefined
                  }
                  onClick={() => setPriority(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <div className="muted mb-2 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-widest">
              Étiquette
              <button className="link-open" onClick={() => setManageOpen(true)}>
                Gérer
              </button>
            </div>
            <div className="scroll-strip">
              {tags.map((t) => (
                <button
                  key={t.id}
                  className="pill"
                  style={tag === t.id ? { background: t.color, borderColor: t.color, color: "#10121a" } : undefined}
                  onClick={() => setTag(tag === t.id ? "" : t.id)}
                >
                  {t.name}
                </button>
              ))}
              <button className="pill" onClick={() => setNewTagOpen(true)}>
                <IconPlus width={13} height={13} /> Nouvelle
              </button>
            </div>
          </div>
          <button className="btn btn-accent w-full" onClick={submit}>
            Ajouter la tâche
          </button>
        </Card>

        <div className="space-y-4">
          <Card className="!py-4">
            <div className="scroll-strip">
              {(
                [
                  ["all", "Toutes"],
                  ["open", "En cours"],
                  ["done", "Terminées"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  className={`pill ${statusFilter === v ? "pill-on" : ""}`}
                  onClick={() => setStatusFilter(v)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="scroll-strip mt-3">
              <button className={`pill ${tagFilter.length === 0 ? "pill-on" : ""}`} onClick={() => setTagFilter([])}>
                Toutes catégories
              </button>
              {tags.map((t) => (
                <button
                  key={t.id}
                  className="pill"
                  style={
                    tagFilter.includes(t.id) ? { background: t.color, borderColor: t.color, color: "#10121a" } : undefined
                  }
                  onClick={() =>
                    setTagFilter((f) => (f.includes(t.id) ? f.filter((x) => x !== t.id) : [...f, t.id]))
                  }
                >
                  {t.name}
                </button>
              ))}
            </div>
            <div className="scroll-strip mt-3">
              <button className={`pill ${prioFilter === "all" ? "pill-on" : ""}`} onClick={() => setPrioFilter("all")}>
                Toutes priorités
              </button>
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  className="pill"
                  style={
                    prioFilter === p
                      ? { background: PRIORITY_COLOR[p], borderColor: PRIORITY_COLOR[p], color: "#10121a" }
                      : undefined
                  }
                  onClick={() => setPrioFilter(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle>En cours — {open.length}</CardTitle>
            {open.length === 0 ? (
              <p className="muted text-sm">Aucune tâche en cours.</p>
            ) : (
              <ul className="space-y-1.5">
                {open.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    tagColor={tagOf(t.tag)?.color}
                    tagName={tagOf(t.tag)?.name}
                    onToggle={() => toggleTask(t.id)}
                    onEdit={() => setEditing(t)}
                    onDelete={() => deleteTask(t.id)}
                  />
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardTitle
              action={
                done.length > 0 ? (
                  <button className="link-open" onClick={archiveDone}>
                    Tout archiver
                  </button>
                ) : undefined
              }
            >
              Terminées — {done.length}
            </CardTitle>
            {done.length === 0 ? (
              <p className="muted text-sm">Rien de terminé pour l&apos;instant.</p>
            ) : (
              <ul className="space-y-1.5">
                {done.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    tagColor={tagOf(t.tag)?.color}
                    tagName={tagOf(t.tag)?.name}
                    onToggle={() => toggleTask(t.id)}
                    onEdit={() => setEditing(t)}
                    onDelete={() => deleteTask(t.id)}
                  />
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <button className="w-full text-left" onClick={() => setShowArchived((s) => !s)}>
              <CardTitle>Archivées — {archived.length} — toucher pour déplier</CardTitle>
            </button>
            {showArchived && (
              <ul className="space-y-1.5">
                {archived.length === 0 && <p className="muted text-sm">Aucune archive.</p>}
                {archived.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    tagColor={tagOf(t.tag)?.color}
                    tagName={tagOf(t.tag)?.name}
                    onToggle={() => toggleTask(t.id)}
                    onEdit={() => setEditing(t)}
                    onDelete={() => deleteTask(t.id)}
                  />
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Modal open={newTagOpen} onClose={() => setNewTagOpen(false)} title="Nouvelle catégorie">
        <input
          className="input mb-3"
          placeholder="Nom de la catégorie"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
        />
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {SWATCHES.map((c) => (
            <button
              key={c}
              onClick={() => setNewTagColor(c)}
              className="h-8 w-8 rounded-full border-2"
              style={{ background: c, borderColor: newTagColor === c ? "#fff" : "transparent" }}
            />
          ))}
          <input type="color" value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)} />
        </div>
        <button
          className="btn btn-accent w-full"
          onClick={() => {
            if (!newTagName.trim()) return;
            addTag(newTagName.trim(), newTagColor);
            setNewTagName("");
            setNewTagOpen(false);
          }}
        >
          Créer la catégorie
        </button>
      </Modal>

      <Modal open={manageOpen} onClose={() => setManageOpen(false)} title="Gérer les catégories">
        <ul className="space-y-2">
          {tags.map((t) => (
            <li key={t.id} className="card-soft flex min-w-0 max-w-full items-center gap-2">
              <input type="color" value={t.color} onChange={(e) => updateTag(t.id, { color: e.target.value })} />
              <input
                className="input min-w-0 flex-1"
                value={t.name}
                onChange={(e) => updateTag(t.id, { name: e.target.value })}
              />
              <button className="btn !px-3" style={{ color: "var(--danger)" }} onClick={() => deleteTag(t.id)}>
                <IconTrash width={16} height={16} />
              </button>
            </li>
          ))}
        </ul>
        <button className="btn mt-3 w-full" onClick={() => setNewTagOpen(true)}>
          <IconPlus width={16} height={16} /> Ajouter une catégorie
        </button>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Modifier la tâche">
        {editing && (
          <div className="space-y-3">
            <input
              className="input"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />
            <div className="grid w-full grid-cols-3 gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  className="pill w-full min-w-0 justify-center !px-2"
                  style={
                    editing.priority === p
                      ? { background: PRIORITY_COLOR[p], borderColor: PRIORITY_COLOR[p], color: "#10121a" }
                      : undefined
                  }
                  onClick={() => setEditing({ ...editing, priority: p })}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="scroll-strip">
              {tags.map((t) => (
                <button
                  key={t.id}
                  className="pill"
                  style={
                    editing.tag === t.id ? { background: t.color, borderColor: t.color, color: "#10121a" } : undefined
                  }
                  onClick={() => setEditing({ ...editing, tag: editing.tag === t.id ? "" : t.id })}
                >
                  {t.name}
                </button>
              ))}
            </div>
            <button
              className="btn btn-accent w-full"
              onClick={() => {
                updateTask(editing.id, { title: editing.title, priority: editing.priority, tag: editing.tag });
                setEditing(null);
              }}
            >
              Enregistrer
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function TaskRow({
  task,
  tagColor,
  tagName,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  tagColor?: string;
  tagName?: string;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="row-hover group flex min-h-[52px] min-w-0 max-w-full flex-wrap items-center gap-x-2 gap-y-2 px-1 py-2 sm:flex-nowrap sm:gap-3 sm:px-2">
      <button
        onClick={onToggle}
        className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 text-[11px] font-black transition-colors"
        style={{
          borderColor: task.done ? "var(--ok)" : "var(--line)",
          background: task.done ? "var(--ok)" : "transparent",
          color: "#10121a",
        }}
        aria-label={task.done ? "Rouvrir" : "Terminer"}
      >
        {task.done ? "✓" : ""}
      </button>
      <button
        className={`min-w-0 flex-1 basis-40 truncate text-left text-sm font-semibold ${task.done ? "line-through opacity-60" : ""}`}
        onClick={onEdit}
      >
        {task.title}
      </button>
      <div className="ml-auto flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-1.5">
        {tagName && tagColor && <Badge color={tagColor}>{tagName}</Badge>}
        <Badge color={PRIORITY_COLOR[task.priority]}>{PRIORITY_LABEL[task.priority]}</Badge>
      </div>
      {/* Suppression directe : disponible quel que soit l'état (en cours, terminée, archivée). */}
      <button
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[var(--muted)] opacity-70 transition hover:text-[var(--danger)] hover:opacity-100"
        onClick={onDelete}
        aria-label={`Supprimer la tâche ${task.title}`}
        title="Supprimer définitivement"
      >
        <IconTrash width={16} height={16} />
      </button>
    </li>
  );
}
