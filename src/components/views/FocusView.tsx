"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useZenith } from "@/components/store";
import { Card, CardTitle, PageHeader, ProgressBar, Ring } from "@/components/ui";
import { IconPause, IconPlay, IconReset, IconSkip } from "@/components/icons";
import { focusMinutesForDay, focusSessionsForDay } from "@/lib/calc";

type Mode = "focus" | "short" | "long";

const MODE_LABEL: Record<Mode, string> = {
  focus: "Concentration",
  short: "Pause courte",
  long: "Pause longue",
};

export default function FocusView() {
  const { state, updatePomodoro, logSession, updateSettings } = useZenith();
  const pomo = state.pomodoro;

  const [mode, setMode] = useState<Mode>("focus");
  const [remaining, setRemaining] = useState(pomo.focusMin * 60);
  const [running, setRunning] = useState(false);
  const [cycle, setCycle] = useState(0);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const duration = useCallback(
    (m: Mode) => (m === "focus" ? pomo.focusMin : m === "short" ? pomo.shortBreakMin : pomo.longBreakMin) * 60,
    [pomo.focusMin, pomo.shortBreakMin, pomo.longBreakMin],
  );

  useEffect(() => {
    setRemaining(duration(mode));
  }, [mode, duration]);

  const notify = useCallback((title: string, body: string) => {
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(title, { body });
      }
    } catch {
      /* ignore */
    }
  }, []);

  const complete = useCallback(() => {
    const current = modeRef.current;
    const minutes = Math.round(duration(current) / 60);
    logSession(current, minutes);
    if (current === "focus") {
      const next = cycle + 1;
      setCycle(next);
      const goLong = next % pomo.sessionsBeforeLongBreak === 0;
      notify("Sprint terminé 🎯", goLong ? "Place à une pause longue." : "Place à une pause courte.");
      setMode(goLong ? "long" : "short");
    } else {
      notify("Pause terminée ⚡", "On repart pour un sprint de concentration.");
      setMode("focus");
    }
    setRunning(false);
  }, [cycle, duration, logSession, notify, pomo.sessionsBeforeLongBreak]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(id);
          complete();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, complete]);

  const total = duration(mode);
  const mm = `${Math.floor(remaining / 60)}`.padStart(2, "0");
  const ss = `${remaining % 60}`.padStart(2, "0");
  const minutesToday = focusMinutesForDay(state);
  const sessionsToday = focusSessionsForDay(state);
  const beforeLong = Math.max(0, pomo.sessionsBeforeLongBreak - (cycle % pomo.sessionsBeforeLongBreak));
  const goalMin = pomo.dailyGoalMin;

  const changeDuration = (delta: number) => {
    const key = mode === "focus" ? "focusMin" : mode === "short" ? "shortBreakMin" : "longBreakMin";
    const currentMin = mode === "focus" ? pomo.focusMin : mode === "short" ? pomo.shortBreakMin : pomo.longBreakMin;
    const next = Math.max(5, Math.min(180, currentMin + delta));
    updatePomodoro({ [key]: next } as Partial<typeof pomo>);
    if (!running) setRemaining(next * 60);
  };

  return (
    <div>
      <PageHeader
        title="Focus."
        subtitle={`${minutesToday} min de concentration aujourd'hui · ${sessionsToday} session${sessionsToday > 1 ? "s" : ""}`}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <Card halo className="flex w-full max-w-full flex-col items-center !p-5 sm:!p-7">
          <div className="mb-7 flex flex-wrap justify-center gap-2">
            {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
              <button
                key={m}
                className={`pill ${mode === m ? "pill-on" : ""}`}
                onClick={() => {
                  setRunning(false);
                  setMode(m);
                }}
              >
                {MODE_LABEL[m]}
              </button>
            ))}
          </div>

          <div className="flex w-full max-w-full flex-wrap items-center justify-center gap-4 sm:gap-6">
            <button className="btn !h-11 !w-11 !px-0 text-xl" onClick={() => changeDuration(-5)} aria-label="Moins 5 min">
              −
            </button>
            <Ring value={total - remaining} max={total} size={268} stroke={16}>
              <div>
                <div className="font-mono text-6xl font-black tabular-nums">
                  {mm}:{ss}
                </div>
                <div className="muted mt-1 text-xs font-bold uppercase tracking-[0.2em]">{MODE_LABEL[mode]}</div>
              </div>
            </Ring>
            <button className="btn !h-11 !w-11 !px-0 text-xl" onClick={() => changeDuration(5)} aria-label="Plus 5 min">
              +
            </button>
          </div>

          <div className="mt-8 flex max-w-full flex-wrap items-center justify-center gap-4">
            <button className="btn !h-12 !w-12 !px-0" onClick={() => setRemaining(duration(mode))} aria-label="Réinitialiser">
              <IconReset width={20} height={20} />
            </button>
            <button
              className="btn btn-accent !h-16 !w-16 !px-0"
              onClick={() => setRunning((r) => !r)}
              aria-label={running ? "Pause" : "Démarrer"}
            >
              {running ? <IconPause width={24} height={24} /> : <IconPlay width={24} height={24} />}
            </button>
            <button
              className="btn !h-12 !w-12 !px-0"
              onClick={() => {
                setRunning(false);
                setMode(mode === "focus" ? "short" : "focus");
              }}
              aria-label="Passer au suivant"
            >
              <IconSkip width={20} height={20} />
            </button>
          </div>

          <p className="muted mt-6 max-w-md text-center text-sm">
            La pause conserve le temps restant. &laquo; Réinitialiser &raquo; remet le compteur à zéro.
          </p>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardTitle>Sessions aujourd&apos;hui</CardTitle>
            <div className="text-4xl font-extrabold">{sessionsToday}</div>
            <p className="muted mt-1 text-sm">{beforeLong} sessions avant une longue pause</p>
          </Card>

          <Card>
            <CardTitle>Objectif du jour</CardTitle>
            <div className="mb-3 text-2xl font-extrabold">
              {minutesToday} min <span className="muted text-base font-normal">/ {Math.round((goalMin / 60) * 10) / 10}h</span>
            </div>
            <ProgressBar value={minutesToday} max={goalMin} />
            <div className="mt-3 flex items-center gap-2">
              <button className="btn !px-3 !py-1.5" onClick={() => updatePomodoro({ dailyGoalMin: Math.max(30, goalMin - 30) })}>
                −30 min
              </button>
              <button className="btn !px-3 !py-1.5" onClick={() => updatePomodoro({ dailyGoalMin: Math.min(720, goalMin + 30) })}>
                +30 min
              </button>
            </div>
          </Card>

          <Card>
            <CardTitle>Alertes de session</CardTitle>
            <p className="muted mb-3 text-sm">
              Recevez une notification du navigateur à la fin de chaque session, même si l&apos;onglet est en arrière-plan.
            </p>
            <button
              className="btn btn-accent w-full"
              onClick={async () => {
                try {
                  const perm = await Notification.requestPermission();
                  updateSettings({ notifications: perm === "granted" });
                } catch {
                  updateSettings({ notifications: false });
                }
              }}
            >
              {state.settings.notifications ? "Alertes activées" : "Activer"}
            </button>
          </Card>

          <Card>
            <CardTitle>Le protocole</CardTitle>
            <ul className="muted space-y-2 text-sm">
              <li>· Sprints de {pomo.focusMin} minutes de concentration pleine.</li>
              <li>· Pause courte de {pomo.shortBreakMin} minutes entre deux sprints.</li>
              <li>· Pause longue de {pomo.longBreakMin} minutes après {pomo.sessionsBeforeLongBreak} sprints.</li>
              <li>· Chaque session terminée est enregistrée et synchronisée sur vos appareils.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
