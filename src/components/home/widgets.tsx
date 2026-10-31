"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useZenith } from "@/components/store";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  IconAverage,
  IconCalendar,
  IconFocus,
  IconHabits,
  IconPlus,
  IconStudies,
  IconTasks,
  IconTracking,
} from "@/components/icons";
import { live } from "@/lib/merge";
import {
  BASE_MAX,
  BOOSTER_MAX,
  dayKey,
  formatNum,
  greeting,
  habitsOnDay,
  lastNDays,
  frShort,
  quoteOfTheDay,
  scoreBreakdownForDay,
  upcomingEvents,
  scoreColor,
  scoreForDay,
} from "@/lib/calc";

const PRIORITY_DOT: Record<string, string> = {
  haute: "var(--danger)",
  moyenne: "var(--warn)",
  basse: "var(--muted)",
};

function WidgetTitle({
  children,
  href,
  Icon,
}: {
  children: React.ReactNode;
  href?: string;
  Icon?: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <span className="flex items-center gap-2">
        {Icon && (
          // Pastille d'icône : centrage parfait en hauteur et largeur.
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "var(--accent-soft)", color: "var(--accent-ink)" }}
          >
            <Icon width={16} height={16} />
          </span>
        )}
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">{children}</span>
      </span>
      {href && (
        <Link href={href} className="link-open text-[11px]">
          Ouvrir
        </Link>
      )}
    </div>
  );
}

/* ------------------------- Horloge & Rituel (4x2) ------------------------- */

export function ClockWidget() {
  const { state } = useZenith();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const key = dayKey();
  const quote = quoteOfTheDay(key);
  const score = scoreBreakdownForDay(state, key);

  return (
    <GlassCard className="h-full p-6 sm:p-7">
      <div className="flex h-full flex-col justify-between gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs capitalize text-[var(--muted)]">
              {now?.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) ?? "…"}
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {greeting()}, {state.settings.userName}
            </h2>
          </div>
          <div className="text-right">
            <div className="font-mono text-4xl font-bold tabular-nums sm:text-5xl" style={{ letterSpacing: "-0.02em" }}>
              {now?.toLocaleTimeString("fr-FR", { hour12: false }) ?? "--:--:--"}
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Heure locale</p>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <p className="max-w-lg text-sm italic leading-relaxed text-[var(--muted)]">
            « {quote.text} » — {quote.author}
          </p>
          <p className="text-xs text-[var(--muted)]">
            <span className="text-base font-bold text-[var(--text)]">{formatNum(score.score)}/20</span>
            <span className="mx-1.5 opacity-40">·</span>
            Socle {formatNum(score.base, 1)}/{BASE_MAX}
            <span className="mx-1 opacity-40">·</span>+{formatNum(score.booster, 1)}/{BOOSTER_MAX}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

/* --------------------------- Tâches urgentes (2x2) -------------------------- */

export function TasksWidget() {
  const { state, toggleTask } = useZenith();
  const tasks = live(state.tasks)
    .filter((t) => !t.done && !t.archived)
    .sort((a, b) => ({ haute: 0, moyenne: 1, basse: 2 })[a.priority] - ({ haute: 0, moyenne: 1, basse: 2 })[b.priority])
    .slice(0, 3);

  return (
    <GlassCard className="h-full p-5">
      <WidgetTitle href="/quotidien?vue=taches" Icon={IconTasks}>Tâches urgentes</WidgetTitle>
      {tasks.length === 0 ? (
        <p className="muted text-sm">Rien d&apos;urgent.</p>
      ) : (
        <ul className="space-y-1">
          {tasks.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => toggleTask(t.id)}
                className="row-hover flex min-h-[44px] w-full items-center gap-3 px-1 text-left"
              >
                <span
                  className="h-[18px] w-[18px] shrink-0 rounded-full border-2"
                  style={{ borderColor: "var(--line)" }}
                />
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: PRIORITY_DOT[t.priority] }} />
                <span className="flex-1 truncate text-sm">{t.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

/* -------------------------- Habitudes du jour (2x2) ------------------------- */

export function HabitsWidget() {
  const { state, toggleHabitDay } = useZenith();
  const key = dayKey();
  const habits = habitsOnDay(state, key);
  const done = habits.filter((h) => (h.history ?? []).includes(key)).length;

  return (
    <GlassCard className="h-full p-5">
      <WidgetTitle href="/quotidien?vue=habitudes" Icon={IconHabits}>
        Habitudes · {done}/{habits.length}
      </WidgetTitle>
      {habits.length === 0 ? (
        <p className="muted text-sm">Aucune habitude.</p>
      ) : (
        <ul className="space-y-1">
          {habits.slice(0, 3).map((h) => {
            const ok = (h.history ?? []).includes(key);
            return (
              <li key={h.id}>
                <button
                  onClick={() => toggleHabitDay(h.id)}
                  className="row-hover flex min-h-[44px] w-full items-center gap-3 px-1 text-left"
                >
                  <span
                    className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2 text-[10px] font-bold"
                    style={{
                      borderColor: ok ? "var(--accent)" : "var(--line)",
                      background: ok ? "var(--accent)" : "transparent",
                      color: "var(--accent-contrast)",
                    }}
                  >
                    {ok ? "✓" : ""}
                  </span>
                  <span className="flex-1 truncate text-sm" style={{ opacity: ok ? 0.5 : 1 }}>
                    {h.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </GlassCard>
  );
}

/* ------------------------- Score productivité (1x1) ------------------------- */

export function ScoreWidget() {
  const { state } = useZenith();
  const week = lastNDays(7).map((d) => scoreForDay(state, d).score);
  const avg = week.reduce((a, b) => a + b, 0) / 7;

  return (
    <GlassCard className="h-full p-5">
      <WidgetTitle href="/progression?vue=moyenne" Icon={IconAverage}>Score</WidgetTitle>
      <div className="text-3xl font-bold tabular-nums" style={{ color: scoreColor(avg) }}>
        {formatNum(avg, 1)}
      </div>
      <p className="muted mt-1 text-[11px]">moyenne 7 jours</p>
    </GlassCard>
  );
}

/* ----------------------------- Focus jour (1x1) ----------------------------- */

export function FocusWidget() {
  const { state } = useZenith();
  const key = dayKey();
  const minutes = live(state.pomodoro.sessionsLog)
    .filter((s) => s.type === "focus" && s.date === key)
    .reduce((sum, s) => sum + (Number(s.minutes) || 0), 0);

  return (
    <GlassCard className="h-full p-5">
      <WidgetTitle href="/academie?vue=focus" Icon={IconFocus}>Focus</WidgetTitle>
      <div className="text-3xl font-bold tabular-nums">{minutes}</div>
      <p className="muted mt-1 text-[11px]">min aujourd&apos;hui</p>
    </GlassCard>
  );
}

/* --------------------------- Raccourcis (icônes iOS) ------------------------- */

const SHORTCUTS = [
  { href: "/quotidien?vue=taches", label: "Tâches", Icon: IconTasks },
  { href: "/academie?vue=focus", label: "Pomodoro", Icon: IconFocus },
  { href: "/calendrier", label: "Agenda", Icon: IconCalendar },
  { href: "/academie?vue=etudes", label: "Note", Icon: IconStudies },
  { href: "/progression?vue=suivi", label: "Pesée", Icon: IconTracking },
  { href: "/quotidien?vue=habitudes", label: "Habitudes", Icon: IconHabits },
];

export function ShortcutsWidget() {
  return (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
      {SHORTCUTS.map(({ href, label, Icon }) => (
        <Link key={href} href={href} className="flex flex-col items-center gap-2">
          <GlassCard
            interactive
            as="div"
            className="flex aspect-square w-full items-center justify-center"
          >
            {/* Centrage strict de l'icône, en hauteur et en largeur. */}
            <span className="flex h-full w-full items-center justify-center" style={{ color: "var(--accent-ink)" }}>
              <Icon width={24} height={24} />
            </span>
          </GlassCard>
          <span className="text-[11px] font-medium text-[var(--muted)]">{label}</span>
        </Link>
      ))}
    </div>
  );
}


/* ------------------------- Prochains événements (2x2) ------------------------ */

export function AgendaWidget() {
  const { state } = useZenith();
  const next = upcomingEvents(state.events, 2);

  return (
    <GlassCard className="h-full p-5">
      <WidgetTitle href="/calendrier" Icon={IconCalendar}>
        Agenda
      </WidgetTitle>
      {next.length === 0 ? (
        <p className="muted text-sm">Aucun événement à venir.</p>
      ) : (
        <ul className="space-y-2">
          {next.map((e) => (
            <li key={e.id} className="flex items-baseline gap-2">
              <span className="font-mono text-xs tabular-nums" style={{ color: "var(--accent-ink)" }}>
                {e.start}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">{e.title}</span>
              <span className="shrink-0 text-[10px] text-[var(--muted)]">
                {e.date === dayKey() ? "auj." : frShort(e.date)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
