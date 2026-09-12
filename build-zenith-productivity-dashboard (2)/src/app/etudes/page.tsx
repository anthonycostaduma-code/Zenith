"use client";

import { useState } from "react";
import { useZenith } from "@/components/store";
import { Card, CardTitle, PageHeader, Ring, Toggle } from "@/components/ui";
import { IconChevron, IconPencil, IconTrash } from "@/components/icons";
import { live } from "@/lib/merge";
import {
  computedSubjectAverage,
  dayKey,
  daysUntil,
  formatNum,
  frDate,
  generalAverage,
  mention,
  subjectAverage,
  subjectCoeffTotal,
} from "@/lib/calc";

const SWATCHES = ["#C6F000", "#FF6B8B", "#FFB020", "#4FA8FF", "#B07CFF", "#4BE3A2"];

export default function StudiesPage() {
  const { state, addSubject, updateSubject, deleteSubject, addGrade, deleteGrade, addExam, deleteExam } = useZenith();
  const subjects = live(state.subjects);
  const exams = live(state.exams).sort((a, b) => a.date.localeCompare(b.date));
  const general = generalAverage(state.subjects);

  const [subjectName, setSubjectName] = useState("");
  const [subjectColor, setSubjectColor] = useState(SWATCHES[0]);
  const [openId, setOpenId] = useState<string | null>(null);

  const [examTitle, setExamTitle] = useState("");
  const [examSubject, setExamSubject] = useState("");
  const [examDate, setExamDate] = useState(dayKey());

  return (
    <div>
      <PageHeader
        title="Études."
        subtitle={`Moyenne générale ${general.average === null ? "—" : formatNum(general.average)}/20 · ${
          general.average === null ? "aucune note" : mention(general.average)
        } · ${general.noteCount} notes`}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <div className="space-y-4">
          <Card halo className="flex flex-wrap items-center gap-6">
            <Ring value={general.average ?? 0} max={20} size={156}>
              <div>
                <div className="text-3xl font-extrabold">
                  {general.average === null ? "—" : formatNum(general.average)}
                </div>
                <div className="muted text-[11px] uppercase tracking-widest">/20</div>
              </div>
            </Ring>
            <div className="min-w-[200px] flex-1">
              <CardTitle>Moyenne générale</CardTitle>
              <div className="text-2xl font-extrabold" style={{ color: "var(--accent)" }}>
                {general.average === null ? "Aucune note" : mention(general.average)}
              </div>
              <p className="muted mt-2 text-sm">
                Moyenne des matières, chacune pondérée par les coefficients de ses notes.
              </p>
            </div>
          </Card>

          <Card>
            <CardTitle>Matières &amp; notes</CardTitle>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <input
                className="input flex-1"
                placeholder="Ajouter une matière — ex : Algèbre linéaire"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
              />
              <div className="flex items-center gap-1.5">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSubjectColor(c)}
                    className="h-7 w-7 rounded-full border-2"
                    style={{ background: c, borderColor: subjectColor === c ? "#fff" : "transparent" }}
                  />
                ))}
              </div>
              <button
                className="btn btn-accent"
                onClick={() => {
                  if (!subjectName.trim()) return;
                  addSubject(subjectName.trim(), subjectColor);
                  setSubjectName("");
                }}
              >
                Ajouter
              </button>
            </div>

            <div className="space-y-3">
              {subjects.length === 0 && <p className="muted text-sm">Aucune matière pour l&apos;instant.</p>}
              {subjects.map((s) => {
                const avg = subjectAverage(s);
                const computed = computedSubjectAverage(s);
                const isOpen = openId === s.id;
                return (
                  <div key={s.id} className="card-soft">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: s.color }} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-bold">{s.name}</div>
                        <div className="muted text-xs">
                          {(s.notes ?? []).length} notes · coeff. total {subjectCoeffTotal(s)}
                        </div>
                      </div>
                      <span
                        className="rounded-full px-3 py-1 text-sm font-extrabold"
                        style={{ background: `${s.color}22`, color: s.color }}
                      >
                        {avg === null ? "—" : `${formatNum(avg)}/20`}
                      </span>
                      <button style={{ color: "var(--danger)" }} onClick={() => deleteSubject(s.id)}>
                        <IconTrash width={16} height={16} />
                      </button>
                      <button onClick={() => setOpenId(isOpen ? null : s.id)} aria-label="Déplier">
                        <IconChevron
                          width={18}
                          height={18}
                          style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}
                        />
                      </button>
                    </div>

                    {isOpen && (
                      <div className="mt-4 space-y-4 border-t border-white/5 pt-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <Toggle
                            on={s.useManual}
                            onChange={(v) =>
                              updateSubject(s.id, { useManual: v, manualAverage: s.manualAverage ?? computed ?? 10 })
                            }
                          />
                          <span className="text-sm font-bold">Moyenne manuelle</span>
                          {s.useManual && (
                            <span className="flex items-center gap-2">
                              <IconPencil width={15} height={15} />
                              <input
                                className="input !w-24 !py-1.5"
                                type="number"
                                step="0.01"
                                min="0"
                                max="20"
                                value={s.manualAverage ?? 0}
                                onChange={(e) => updateSubject(s.id, { manualAverage: Number(e.target.value) })}
                              />
                              <span className="muted text-xs">Saisir</span>
                            </span>
                          )}
                          <span className="muted text-xs">
                            Calculée : {computed === null ? "—" : `${formatNum(computed)}/20`}
                          </span>
                        </div>

                        <GradeForm onAdd={(g) => addGrade(s.id, g)} />

                        <ul className="space-y-1.5">
                          {(s.notes ?? []).map((n) => (
                            <li key={n.id} className="row-hover flex items-center gap-3 px-2 py-2 text-sm">
                              <span className="w-16 font-extrabold" style={{ color: s.color }}>
                                {formatNum(Number(n.grade), 2)}/20
                              </span>
                              <span className="min-w-0 flex-1 truncate">{n.title}</span>
                              <span className="muted text-xs">coeff. {n.coeff}</span>
                              <span className="muted text-xs">{n.date ? frDate(n.date, { day: "2-digit", month: "2-digit", year: "2-digit" }) : ""}</span>
                              <button style={{ color: "var(--danger)" }} onClick={() => deleteGrade(s.id, n.id)}>
                                <IconTrash width={15} height={15} />
                              </button>
                            </li>
                          ))}
                          {(s.notes ?? []).length === 0 && <p className="muted text-sm">Aucune note.</p>}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardTitle>Examens</CardTitle>
            <div className="space-y-2">
              <input
                className="input"
                placeholder="Titre de l'examen"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
              />
              <select className="input select" value={examSubject} onChange={(e) => setExamSubject(e.target.value)}>
                <option value="">Matière</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input className="input" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
              <button
                className="btn btn-accent w-full"
                onClick={() => {
                  if (!examTitle.trim() || !examDate) return;
                  addExam(examTitle.trim(), examSubject, examDate);
                  setExamTitle("");
                }}
              >
                Planifier l&apos;examen
              </button>
            </div>
          </Card>

          <Card>
            <CardTitle>Examens planifiés</CardTitle>
            {exams.length === 0 ? (
              <p className="muted text-sm">Aucun examen planifié.</p>
            ) : (
              <ul className="space-y-2">
                {exams.map((e) => {
                  const d = daysUntil(e.date);
                  const soon = d >= 0 && d < 5;
                  const subject = subjects.find((s) => s.id === e.subjectId);
                  return (
                    <li
                      key={e.id}
                      className="flex items-center gap-3 rounded-[20px_16px_20px_16px] border p-3"
                      style={{
                        borderColor: soon ? "var(--warn)" : "var(--line)",
                        background: soon ? "rgba(255,176,32,0.08)" : "rgba(255,255,255,0.02)",
                      }}
                    >
                      <span
                        className="text-2xl font-extrabold"
                        style={{ color: soon ? "var(--warn)" : d < 0 ? "var(--muted)" : "var(--accent)" }}
                      >
                        {d < 0 ? "✓" : `J-${d}`}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-bold">{e.title}</div>
                        <div className="muted truncate text-xs">
                          {subject?.name ?? "Sans matière"} · {frDate(e.date)} · {Math.abs(d)} jours
                        </div>
                      </div>
                      <button style={{ color: "var(--danger)" }} onClick={() => deleteExam(e.id)}>
                        <IconTrash width={16} height={16} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function GradeForm({ onAdd }: { onAdd: (g: { title: string; grade: number; coeff: number; date: string }) => void }) {
  const [title, setTitle] = useState("");
  const [grade, setGrade] = useState("");
  const [coeff, setCoeff] = useState("1");
  const [date, setDate] = useState(dayKey());
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_90px_90px_150px_auto]">
      <input className="input" placeholder="Devoir 1..." value={title} onChange={(e) => setTitle(e.target.value)} />
      <input
        className="input"
        type="number"
        step="0.25"
        min="0"
        max="20"
        placeholder="Note"
        value={grade}
        onChange={(e) => setGrade(e.target.value)}
      />
      <input
        className="input"
        type="number"
        step="0.5"
        min="0"
        placeholder="Coeff"
        value={coeff}
        onChange={(e) => setCoeff(e.target.value)}
      />
      <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <button
        className="btn btn-accent whitespace-nowrap"
        onClick={() => {
          const g = Number(grade);
          if (!title.trim() || Number.isNaN(g)) return;
          onAdd({ title: title.trim(), grade: g, coeff: Number(coeff) || 1, date });
          setTitle("");
          setGrade("");
          setCoeff("1");
        }}
      >
        + Ajouter la note
      </button>
    </div>
  );
}
