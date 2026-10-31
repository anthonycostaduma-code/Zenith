"use client";

import { useMemo, useState } from "react";
import { useZenith } from "@/components/store";
import { BarChart, Card, CardTitle, LineChart, PageHeader, Ring, type Point } from "@/components/ui";
import {
  BASE_MAX,
  BOOSTER_MAX,
  addDays,
  dayKey,
  formatNum,
  scoreBreakdownForDay,
  frDate,
  frShort,
  lastNDays,
  parseKey,
  pointsForDay,
  scoreColor,
  scoreForDay,
  scoreMention,
} from "@/lib/calc";

type View = "semaine" | "mois" | "annee";

export default function AverageView() {
  const { state, updateSettings } = useZenith();
  const [view, setView] = useState<View>("semaine");
  const [offset, setOffset] = useState(0);
  const goal = state.settings.dailyPointsGoal;

  const data = useMemo<Point[]>(() => {
    if (view === "semaine") {
      const end = addDays(dayKey(), offset * 7);
      return lastNDays(7, end).map((d) => {
        const s = scoreForDay(state, d);
        return {
          label: parseKey(d).toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 3),
          value: s.score,
          hint: `${frDate(d, { day: "numeric", month: "short" })} · ${s.tasks} tâche${s.tasks > 1 ? "s" : ""}`,
        };
      });
    }
    if (view === "mois") {
      const base = new Date();
      base.setMonth(base.getMonth() + offset, 1);
      const year = base.getFullYear();
      const month = base.getMonth();
      const days = new Date(year, month + 1, 0).getDate();
      return Array.from({ length: days }, (_, i) => {
        const key = dayKey(new Date(year, month, i + 1));
        const s = scoreForDay(state, key);
        return { label: `${i + 1}`, value: s.score, hint: `${frShort(key)} · ${s.tasks} tâche(s)` };
      });
    }
    const year = new Date().getFullYear() + offset;
    return Array.from({ length: 12 }, (_, m) => {
      const days = new Date(year, m + 1, 0).getDate();
      let sum = 0;
      for (let d = 1; d <= days; d++) sum += scoreForDay(state, dayKey(new Date(year, m, d))).score;
      return {
        label: new Date(year, m, 1).toLocaleDateString("fr-FR", { month: "short" }).slice(0, 3),
        value: sum / days,
        hint: new Date(year, m, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
      };
    });
  }, [view, offset, state]);

  const periodAvg = data.length ? data.reduce((a, b) => a + b.value, 0) / data.length : 0;

  const week = lastNDays(7);
  const weekScores = week.map((d) => scoreForDay(state, d));
  const weekAvg = weekScores.reduce((a, b) => a + b.score, 0) / 7;
  const weekTasks = weekScores.reduce((a, b) => a + b.tasks, 0);

  const now = new Date();
  const monthDays = Array.from({ length: now.getDate() }, (_, i) => dayKey(new Date(now.getFullYear(), now.getMonth(), i + 1)));
  const monthScores = monthDays.map((d) => scoreForDay(state, d));
  const monthAvg = monthScores.reduce((a, b) => a + b.score, 0) / Math.max(1, monthScores.length);
  const monthTasks = monthScores.reduce((a, b) => a + b.tasks, 0);

  const best = data.reduce((acc, p) => (p.value > acc ? p.value : acc), 0);

  const yearMonths = Array.from({ length: 12 }, (_, m) => {
    const days = new Date(now.getFullYear(), m + 1, 0).getDate();
    let sum = 0;
    let tasks = 0;
    for (let d = 1; d <= days; d++) {
      const key = dayKey(new Date(now.getFullYear(), m, d));
      const s = scoreForDay(state, key);
      sum += s.score;
      tasks += s.tasks;
    }
    return { avg: sum / days, tasks };
  });
  const activeMonths = yearMonths.filter((m) => m.tasks > 0);
  const yearAvg = activeMonths.length ? activeMonths.reduce((a, b) => a + b.avg, 0) / activeMonths.length : 0;

  const todayPoints = pointsForDay(state.tasks, dayKey()).points;
  const todayBreakdown = scoreBreakdownForDay(state, dayKey());

  return (
    <div>
      <PageHeader
        title="Moyenne."
        subtitle="Votre note de productivité, calculée à partir des tâches que vous accomplissez."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
        <Card halo className="flex flex-col items-center !p-6">
          <Ring value={periodAvg} max={20} size={190} stroke={15} color={scoreColor(periodAvg)}>
            <div>
              <div className="text-4xl font-extrabold">{formatNum(periodAvg)}</div>
              <div className="muted text-[11px] uppercase tracking-widest">/20</div>
            </div>
          </Ring>
          <div className="mt-4 text-lg font-extrabold" style={{ color: scoreColor(periodAvg) }}>
            {scoreMention(periodAvg)}
          </div>
          <p className="muted text-sm capitalize">{view === "annee" ? "année" : view} en cours</p>
          <p className="muted mt-2 text-xs">
            Aujourd&apos;hui — Socle&nbsp;: {formatNum(todayBreakdown.base, 1)}/{BASE_MAX} · Booster&nbsp;: +
            {formatNum(todayBreakdown.booster, 1)}/{BOOSTER_MAX}
          </p>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Mini label="Moyenne 7 jours" value={`${formatNum(weekAvg)}/20`} hint={`${weekTasks} tâches`} />
          <Mini
            label="Moyenne du mois"
            value={`${formatNum(monthAvg)}/20`}
            hint={`${monthTasks} tâches sur ${monthDays.length} j`}
          />
          <Mini label="Meilleure journée" value={`${formatNum(best)}/20`} hint="record sur la période" />
          <Mini label="Moyenne annuelle" value={`${formatNum(yearAvg)}/20`} hint="mois actifs uniquement" />
        </div>
      </div>

      <Card className="mt-4">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {(["semaine", "mois", "annee"] as View[]).map((v) => (
              <button
                key={v}
                className={`pill ${view === v ? "pill-on" : ""}`}
                onClick={() => {
                  setView(v);
                  setOffset(0);
                }}
              >
                {v === "annee" ? "Année" : v}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button className="btn !px-3 !py-1.5" onClick={() => setOffset((o) => o - 1)}>
              ◀
            </button>
            <button className="btn !px-3 !py-1.5" onClick={() => setOffset((o) => Math.min(0, o + 1))}>
              ▶
            </button>
            {offset !== 0 && (
              <button className="link-open" onClick={() => setOffset(0)}>
                Revenir à la période en cours
              </button>
            )}
          </div>
        </div>
        {view === "semaine" ? <BarChart data={data} /> : <LineChart data={data} min={0} max={20} unit="/20" />}
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Objectif quotidien</CardTitle>
          <div className="flex items-center gap-4">
            <button className="btn !h-10 !w-10 !px-0 text-lg" onClick={() => updateSettings({ dailyPointsGoal: Math.max(1, goal - 1) })}>
              −
            </button>
            <div className="text-center">
              <div className="text-4xl font-extrabold">{goal}</div>
              <div className="muted text-xs uppercase tracking-widest">points / jour</div>
            </div>
            <button className="btn !h-10 !w-10 !px-0 text-lg" onClick={() => updateSettings({ dailyPointsGoal: Math.min(60, goal + 1) })}>
              +
            </button>
          </div>
          <p className="muted mt-3 text-sm">
            Nombre de points visés chaque jour pour atteindre 20/20. Aujourd&apos;hui : <b>{todayPoints}</b> point
            {todayPoints > 1 ? "s" : ""} accumulé{todayPoints > 1 ? "s" : ""}.
          </p>
        </Card>

        <Card>
          <CardTitle>Comment est calculée la moyenne ?</CardTitle>
          <ul className="muted space-y-2 text-sm">
            <li>
              · <b className="text-[var(--text)]">Socle — habitudes (16 points).</b> Part des habitudes du jour validées
              × 16. C&apos;est la base principale de la note.
            </li>
            <li>
              · <b className="text-[var(--text)]">Booster — tâches (3 points max).</b> Haute = 3, moyenne = 2, basse = 1 ;
              points ÷ objectif quotidien × 3.
            </li>
            <li>
              · <b className="text-[var(--text)]">Booster — équilibre (1 point max).</b> Récompense les tâches réparties
              sur plusieurs catégories différentes.
            </li>
            <li>· Note du jour = socle + booster, plafonnée à 20/20.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Mini({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="!p-5">
      <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]">{label}</div>
      <div className="mt-2 text-2xl font-extrabold">{value}</div>
      <p className="muted mt-1 text-xs">{hint}</p>
    </Card>
  );
}
