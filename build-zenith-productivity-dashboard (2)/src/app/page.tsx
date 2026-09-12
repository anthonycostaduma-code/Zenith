"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useZenith } from "@/components/store";
import { Badge, Card, CardTitle, ProgressBar, Sparkline } from "@/components/ui";
import { IconFlame, IconFocus } from "@/components/icons";
import { live } from "@/lib/merge";
import {
  PRIORITY_LABEL,
  bestGlobalStreak,
  dayKey,
  daysUntil,
  focusMinutesForDay,
  focusSessionsForDay,
  formatNum,
  frDate,
  generalAverage,
  greeting,
  habitsDoneToday,
  lastNDays,
  quoteOfTheDay,
  scoreForDay,
  scoreMention,
  subjectAverage,
} from "@/lib/calc";

const PRIORITY_COLOR: Record<string, string> = {
  haute: "#FF5C7A",
  moyenne: "#FFB020",
  basse: "#8FD9B6",
};

export default function HomePage() {
  const { state, toggleTask, toggleHabitDay, ready } = useZenith();
  const [clock, setClock] = useState<string>("");
  const [today, setToday] = useState<string>("");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(d.toLocaleTimeString("fr-FR", { hour12: false }));
      setToday(
        d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }).toUpperCase(),
      );
    };
    tick();
    const i = window.setInterval(tick, 1000);
    return () => window.clearInterval(i);
  }, []);

  const key = dayKey();
  const habits = live(state.habits);
  const tasks = live(state.tasks).filter((t) => !t.archived);
  const openTasks = tasks.filter((t) => !t.done);
  const doneHabits = habitsDoneToday(state.habits);
  const habitPct = habits.length ? Math.round((doneHabits / habits.length) * 100) : 0;
  const dayScore = scoreForDay(state, key);
  const week = lastNDays(7).map((d) => scoreForDay(state, d).score);
  const weekAvg = week.reduce((a, b) => a + b, 0) / 7;
  const focusMin = focusMinutesForDay(state);
  const focusSessions = focusSessionsForDay(state);
  const goalH = Math.round((state.pomodoro.dailyGoalMin / 60) * 10) / 10;
  const exams = live(state.exams)
    .filter((e) => daysUntil(e.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextExam = exams[0];
  const subjects = live(state.subjects);
  const general = generalAverage(state.subjects);
  const quote = quoteOfTheDay(key);
  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? "Matière";
  const tagOf = (id: string) => live(state.tags).find((t) => t.id === id);

  if (!ready) return <div className="muted p-6">Chargement de votre espace…</div>;

  return (
    <div className="space-y-5">
      <header className="card halo flex flex-col gap-6 !rounded-[34px_26px_34px_26px] !p-7 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--muted)]">{today}</div>
          <h1 className="title-xl mt-2">
            {greeting()}, {state.settings.userName}
          </h1>
          <figure className="relative mt-6 pl-9">
            <span
              className="absolute left-0 top-[-6px] font-serif text-6xl leading-none"
              style={{ color: "var(--accent)", opacity: 0.6 }}
            >
              &ldquo;
            </span>
            <blockquote className="text-xl italic leading-snug sm:text-2xl">{quote.text}</blockquote>
            <figcaption className="mt-2 text-sm font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              — {quote.author}
            </figcaption>
          </figure>
        </div>
        <div
          className="shrink-0 rounded-[28px_20px_28px_20px] px-7 py-5 text-center"
          style={{
            background: "linear-gradient(140deg, var(--accent-soft), rgba(255,255,255,0.02))",
            border: "1px solid var(--accent-soft)",
          }}
        >
          <div
            className="font-mono text-5xl font-black tabular-nums sm:text-6xl"
            style={{ color: "var(--accent)", letterSpacing: "-0.02em" }}
          >
            {clock || "--:--:--"}
          </div>
          <div className="mt-1 text-[11px] font-extrabold uppercase tracking-[0.28em] text-[var(--muted)]">
            Heures locale
          </div>
        </div>
      </header>

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <CardTitle>Rituel quotidien</CardTitle>
          <div className="text-2xl font-extrabold">
            {doneHabits}/{habits.length} · {habitPct}%
          </div>
          <p className="muted text-sm">
            {habits.length - doneHabits} habitude{habits.length - doneHabits > 1 ? "s" : ""} restante
            {habits.length - doneHabits > 1 ? "s" : ""} aujourd&apos;hui
          </p>
        </div>
        <div className="min-w-[220px] flex-1">
          <ProgressBar value={habitPct} max={100} />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Moyenne du jour"
          value={`${formatNum(dayScore.score)}/20`}
          hint={dayScore.score <= 0 ? "Aucune activité" : scoreMention(dayScore.score)}
        />
        <StatCard
          label="Meilleure série"
          value={`${bestGlobalStreak(state.habits)} j`}
          hint="Jours consécutifs avec une habitude"
        />
        <StatCard
          label="Focus aujourd'hui"
          value={`${focusMin} min`}
          hint={`sur ${goalH}h d'objectif`}
        />
        <StatCard
          label="Prochain examen"
          value={nextExam ? `J-${daysUntil(nextExam.date)}` : "—"}
          hint={nextExam ? subjectName(nextExam.subjectId) : "Aucun examen planifié"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle action={<Link href="/moyenne" className="link-open">Ouvrir →</Link>}>
            Moyenne de la semaine
          </CardTitle>
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-4xl font-extrabold">{formatNum(weekAvg)}/20</div>
              <p className="muted text-sm">{scoreMention(weekAvg)} · 7 derniers jours</p>
            </div>
            <div className="w-1/2">
              <Sparkline data={week} />
            </div>
          </div>
        </Card>

        <Card halo>
          <CardTitle action={<Link href="/focus" className="link-open">Ouvrir →</Link>}>Focus profond</CardTitle>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-4xl font-extrabold">{focusSessions}</div>
              <p className="muted text-sm">
                session{focusSessions > 1 ? "s" : ""} aujourd&apos;hui · {focusMin} min cumulées
              </p>
            </div>
            <Link href="/focus" className="btn btn-accent">
              <IconFocus width={18} height={18} />
              Lancer le focus
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle action={<Link href="/taches" className="link-open">Ouvrir →</Link>}>File prioritaire</CardTitle>
          {openTasks.length === 0 ? (
            <p className="muted text-sm">Rien en attente. Profitez-en pour avancer sur vos habitudes.</p>
          ) : (
            <ul className="space-y-1.5">
              {[...openTasks]
                .sort(
                  (a, b) =>
                    ({ haute: 0, moyenne: 1, basse: 2 })[a.priority] - ({ haute: 0, moyenne: 1, basse: 2 })[b.priority],
                )
                .slice(0, 6)
                .map((t) => {
                  const tag = tagOf(t.tag);
                  return (
                    <li key={t.id} className="row-hover flex items-center gap-3 px-2 py-2">
                      <button
                        onClick={() => toggleTask(t.id)}
                        className="h-5 w-5 shrink-0 rounded-full border-2 transition-colors"
                        style={{ borderColor: "var(--muted)" }}
                        aria-label="Terminer la tâche"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{t.title}</span>
                      {tag && <Badge color={tag.color}>{tag.name}</Badge>}
                      <Badge color={PRIORITY_COLOR[t.priority]}>{PRIORITY_LABEL[t.priority]}</Badge>
                    </li>
                  );
                })}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitle action={<Link href="/habitudes" className="link-open">Ouvrir →</Link>}>Rituel du jour</CardTitle>
          <p className="muted mb-3 text-sm">
            {doneHabits} sur {habits.length}
          </p>
          {habits.length === 0 ? (
            <p className="muted text-sm">Créez votre première habitude quotidienne.</p>
          ) : (
            <ul className="space-y-1.5">
              {habits.slice(0, 6).map((h) => {
                const done = (h.history ?? []).includes(key);
                return (
                  <li key={h.id}>
                    <button
                      onClick={() => toggleHabitDay(h.id)}
                      className="row-hover flex w-full items-center gap-3 px-2 py-2 text-left"
                    >
                      <span
                        className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 text-[11px] font-black"
                        style={{
                          borderColor: done ? "var(--accent)" : "var(--muted)",
                          background: done ? "var(--accent)" : "transparent",
                          color: "var(--accent-contrast)",
                        }}
                      >
                        {done ? "✓" : ""}
                      </span>
                      <span className="flex-1 truncate text-sm font-semibold">{h.name}</span>
                      <span className="muted flex items-center gap-1 text-xs">
                        <IconFlame width={14} height={14} />
                        {(h.history ?? []).length}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle action={<Link href="/etudes" className="link-open">Ouvrir →</Link>}>Moyennes par matière</CardTitle>
          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold">
              {general.average === null ? "—" : `${formatNum(general.average)}/20`}
            </span>
            <span className="muted text-xs uppercase tracking-widest">Moyenne générale</span>
          </div>
          {subjects.length === 0 ? (
            <p className="muted text-sm">Ajoutez vos matières dans l&apos;onglet Études.</p>
          ) : (
            <div className="space-y-3">
              {subjects.slice(0, 6).map((s) => {
                const avg = subjectAverage(s);
                return (
                  <div key={s.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-semibold">{s.name}</span>
                      <span className="muted">{avg === null ? "—" : `${formatNum(avg)}/20`}</span>
                    </div>
                    <ProgressBar value={avg ?? 0} color={s.color} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <CardTitle action={<Link href="/etudes" className="link-open">Ouvrir →</Link>}>Examens à venir</CardTitle>
          {exams.length === 0 ? (
            <p className="muted text-sm">Aucun examen planifié.</p>
          ) : (
            <ul className="space-y-2">
              {exams.slice(0, 5).map((e) => {
                const d = daysUntil(e.date);
                const soon = d < 5;
                return (
                  <li
                    key={e.id}
                    className="flex items-center gap-3 rounded-[20px_16px_20px_16px] border p-3"
                    style={{
                      borderColor: soon ? "var(--warn)" : "var(--line)",
                      background: soon ? "rgba(255,176,32,0.08)" : "rgba(255,255,255,0.02)",
                    }}
                  >
                    <span className="text-xl font-extrabold" style={{ color: soon ? "var(--warn)" : "var(--accent)" }}>
                      J-{d}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold">{e.title}</div>
                      <div className="muted truncate text-xs">
                        {subjectName(e.subjectId)} · {frDate(e.date)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-4 text-sm">
        <span className="muted">
          {formatNum(dayScore.score)}/20 aujourd&apos;hui — {openTasks.length} tâche
          {openTasks.length > 1 ? "s" : ""} encore ouverte{openTasks.length > 1 ? "s" : ""}.
        </span>
        <Link href="/moyenne" className="link-open">
          Voir mes moyennes →
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="!p-5">
      <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]">{label}</div>
      <div className="mt-2 text-3xl font-extrabold">{value}</div>
      <p className="muted mt-1 text-xs">{hint}</p>
    </Card>
  );
}


