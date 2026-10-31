"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { mergeState, normalizeHome, normalizeState } from "@/lib/merge";
import { dayKey } from "@/lib/calc";
import {
  CalEvent,
  Exam,
  Grade,
  HOME_DEFAULT,
  Habit,
  HabitCategory,
  PhotoMeta,
  PomoSession,
  Priority,
  Subject,
  Tag,
  Task,
  ThemeMode,
  WeekDay,
  WeightEntry,
  ZState,
  defaultState,
  makeSpaceCode,
  nowIso,
  uid,
} from "@/lib/types";

type SyncStatus = "idle" | "syncing" | "synced" | "pending" | "offline";

interface StoreValue {
  state: ZState;
  photos: PhotoMeta[];
  ready: boolean;
  status: SyncStatus;
  lastSync: string | null;
  code: string;
  /* tâches */
  addTask: (title: string, priority: Priority, tag: string) => void;
  toggleTask: (id: string) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  archiveDone: () => void;
  /* étiquettes */
  addTag: (name: string, color: string) => void;
  updateTag: (id: string, patch: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  /* habitudes */
  addHabit: (name: string, category: string, targetDays?: WeekDay[]) => void;
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  toggleHabitDay: (id: string, day?: string) => void;
  deleteHabit: (id: string) => void;
  addHabitCategory: (name: string, color: string) => void;
  updateHabitCategory: (id: string, patch: Partial<HabitCategory>) => void;
  deleteHabitCategory: (id: string) => void;
  /* études */
  addSubject: (name: string, color: string) => void;
  updateSubject: (id: string, patch: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  addGrade: (subjectId: string, grade: Omit<Grade, "id">) => void;
  deleteGrade: (subjectId: string, gradeId: string) => void;
  addExam: (title: string, subjectId: string, date: string) => void;
  deleteExam: (id: string) => void;
  /* agenda */
  addEvent: (data: Omit<CalEvent, "id" | "updatedAt" | "createdAt" | "deleted">) => void;
  updateEvent: (id: string, patch: Partial<CalEvent>) => void;
  toggleEventDone: (id: string) => void;
  deleteEvent: (id: string) => void;
  /* focus */
  updatePomodoro: (patch: Partial<Omit<ZState["pomodoro"], "sessionsLog">>) => void;
  logSession: (type: PomoSession["type"], minutes: number) => void;
  /* suivi */
  addWeightEntry: (kg: number, date: string, note: string) => void;
  deleteWeightEntry: (id: string) => void;
  uploadPhoto: (dataUrl: string, caption: string, date: string) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
  /* réglages */
  updateSettings: (patch: Partial<ZState["settings"]>) => void;
  setAccent: (accent: string, preset: string) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setBackground: (color: string | null) => void;
  /* accueil personnalisable */
  toggleHomeWidget: (id: string) => void;
  moveHomeWidget: (id: string, direction: -1 | 1) => void;
  resetHomeLayout: () => void;
  joinSpace: (code: string) => Promise<boolean>;
  newSpace: () => Promise<void>;
  syncNow: () => void;
  exportBackup: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const LS_CODE = "zenith.code";
const LS_STATE = "zenith.state";

function stamp<T extends { updatedAt: string }>(item: T): T {
  return { ...item, updatedAt: nowIso() };
}

export function ZenithProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState<string>("");
  const [state, setState] = useState<ZState>(() => defaultState(""));
  const [photos, setPhotos] = useState<PhotoMeta[]>([]);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSync, setLastSync] = useState<string | null>(null);

  const dirty = useRef(false);
  const mutationVersion = useRef(0);
  const busy = useRef(false);
  const stateRef = useRef(state);
  const codeRef = useRef(code);
  stateRef.current = state;
  codeRef.current = code;

  /* ------------------------------ initialisation ----------------------------- */
  useEffect(() => {
    let storedCode = "";
    try {
      storedCode = localStorage.getItem(LS_CODE) ?? "";
    } catch {
      storedCode = "";
    }
    if (!storedCode) {
      storedCode = makeSpaceCode();
      try {
        localStorage.setItem(LS_CODE, storedCode);
      } catch {
        /* ignore */
      }
    }
    let local: ZState = defaultState(storedCode);
    try {
      const raw = localStorage.getItem(`${LS_STATE}.${storedCode}`);
      if (raw) local = normalizeState(JSON.parse(raw), storedCode);
    } catch {
      /* ignore */
    }
    setCode(storedCode);
    setState(local);
    setReady(true);
  }, []);

  /* ------------------------------- persistance ------------------------------- */
  useEffect(() => {
    if (!ready || !code) return;
    try {
      localStorage.setItem(`${LS_STATE}.${code}`, JSON.stringify(state));
    } catch {
      /* quota */
    }
  }, [state, code, ready]);

  /* L'application du thème est centralisée dans ThemeProvider. */

  /* --------------------------------- synchro --------------------------------- */
  const push = useCallback(async () => {
    const c = codeRef.current;
    if (!c || busy.current) return;
    busy.current = true;
    setStatus("syncing");
    const snapshot = stateRef.current;
    const pushedVersion = mutationVersion.current;
    try {
      const res = await fetch(`/api/space/${c}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: snapshot }),
      });
      if (!res.ok) throw new Error("push failed");
      const json = (await res.json()) as { state: ZState; photos: PhotoMeta[] };
      // Le code a pu changer (rejoindre/nouvel espace) pendant la requête : une
      // réponse de l'ancien espace ne doit jamais être fusionnée au nouveau.
      if (codeRef.current !== c) return;
      // Une modification peut arriver pendant la requête. Elle reste alors marquée
      // en attente et sera envoyée au prochain tick au lieu d'être oubliée.
      dirty.current = mutationVersion.current !== pushedVersion;
      setState((cur) => mergeState(cur, normalizeState(json.state, c)));
      setPhotos(json.photos ?? []);
      setLastSync(new Date().toISOString());
      setStatus(dirty.current ? "pending" : "synced");
    } catch {
      setStatus("offline");
    } finally {
      busy.current = false;
    }
  }, []);

  const pull = useCallback(async () => {
    const c = codeRef.current;
    if (!c || busy.current) return;
    busy.current = true;
    try {
      const res = await fetch(`/api/space/${c}`, { cache: "no-store" });
      if (!res.ok) throw new Error("pull failed");
      const json = (await res.json()) as { state: ZState; photos: PhotoMeta[] };
      if (codeRef.current !== c) return;
      const remote = normalizeState(json.state, c);
      setState((cur) => {
        const merged = mergeState(cur, remote);
        return JSON.stringify(merged) === JSON.stringify(cur) ? cur : merged;
      });
      setPhotos(json.photos ?? []);
      setLastSync(new Date().toISOString());
      setStatus(dirty.current ? "pending" : "synced");
    } catch {
      setStatus("offline");
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    if (!ready || !code) return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      if (dirty.current) await push();
      else await pull();
    };
    void tick();
    const interval = window.setInterval(tick, 4000);
    const onFocus = () => void tick();
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onFocus);
    };
  }, [ready, code, push, pull]);

  /* mutation locale + push rapide (debounce) */
  const pushTimer = useRef<number | null>(null);
  const mutate = useCallback(
    (fn: (cur: ZState) => ZState) => {
      setState((cur) => fn(cur));
      mutationVersion.current += 1;
      dirty.current = true;
      setStatus("pending");
      if (pushTimer.current) window.clearTimeout(pushTimer.current);
      pushTimer.current = window.setTimeout(() => void push(), 700);
    },
    [push],
  );

  /* --------------------------------- actions --------------------------------- */
  const value = useMemo<StoreValue>(() => {
    const replace = <T extends { id: string; updatedAt: string }>(list: T[], id: string, patch: Partial<T>): T[] =>
      list.map((i) => (i.id === id ? stamp({ ...i, ...patch }) : i));

    return {
      state,
      photos,
      ready,
      status,
      lastSync,
      code,

      addTask: (title, priority, tag) =>
        mutate((s) => ({
          ...s,
          tasks: [
            ...s.tasks,
            {
              id: uid("task"),
              title,
              priority,
              tag,
              done: false,
              archived: false,
              createdAt: nowIso(),
              completedAt: null,
              updatedAt: nowIso(),
            } satisfies Task,
          ],
        })),
      toggleTask: (id) =>
        mutate((s) => ({
          ...s,
          tasks: s.tasks.map((t) =>
            t.id === id
              ? stamp({ ...t, done: !t.done, completedAt: !t.done ? nowIso() : null })
              : t,
          ),
        })),
      updateTask: (id, patch) => mutate((s) => ({ ...s, tasks: replace(s.tasks, id, patch) })),
      // Suppression directe par ID : ne dépend ni de `done` ni de `archived`.
      // Pose un tombstone horodaté propagé par le merge CRDT-like (src/lib/merge.ts),
      // afin que la suppression gagne aussi sur les autres appareils.
      deleteTask: (id) => mutate((s) => ({ ...s, tasks: replace(s.tasks, id, { deleted: true } as Partial<Task>) })),
      archiveDone: () =>
        mutate((s) => ({
          ...s,
          tasks: s.tasks.map((t) => (t.done && !t.archived && !t.deleted ? stamp({ ...t, archived: true }) : t)),
        })),

      addTag: (name, color) =>
        mutate((s) => ({ ...s, tags: [...s.tags, { id: uid("tag"), name, color, updatedAt: nowIso() }] })),
      updateTag: (id, patch) => mutate((s) => ({ ...s, tags: replace(s.tags, id, patch) })),
      deleteTag: (id) => mutate((s) => ({ ...s, tags: replace(s.tags, id, { deleted: true } as Partial<Tag>) })),

      addHabit: (name, category, targetDays) =>
        mutate((s) => ({
          ...s,
          habits: [
            ...s.habits,
            {
              id: uid("habit"),
              name,
              category,
              history: [],
              targetDays: targetDays && targetDays.length ? targetDays : undefined,
              createdAt: nowIso(),
              updatedAt: nowIso(),
            } satisfies Habit,
          ],
        })),
      updateHabit: (id, patch) => mutate((s) => ({ ...s, habits: replace(s.habits, id, patch) })),
      toggleHabitDay: (id, day) =>
        mutate((s) => ({
          ...s,
          habits: s.habits.map((h) => {
            if (h.id !== id) return h;
            const d = day ?? dayKey();
            const has = (h.history ?? []).includes(d);
            return stamp({
              ...h,
              history: has ? h.history.filter((x) => x !== d) : [...(h.history ?? []), d].sort(),
            });
          }),
        })),
      deleteHabit: (id) => mutate((s) => ({ ...s, habits: replace(s.habits, id, { deleted: true } as Partial<Habit>) })),
      addHabitCategory: (name, color) =>
        mutate((s) => ({
          ...s,
          habitCategories: [...s.habitCategories, { id: uid("hcat"), name, color, updatedAt: nowIso() }],
        })),
      updateHabitCategory: (id, patch) =>
        mutate((s) => ({ ...s, habitCategories: replace(s.habitCategories, id, patch) })),
      deleteHabitCategory: (id) =>
        mutate((s) => ({
          ...s,
          habitCategories: replace(s.habitCategories, id, { deleted: true } as Partial<HabitCategory>),
        })),

      addSubject: (name, color) =>
        mutate((s) => ({
          ...s,
          subjects: [
            ...s.subjects,
            {
              id: uid("subj"),
              name,
              color,
              manualAverage: null,
              useManual: false,
              notes: [],
              updatedAt: nowIso(),
            } satisfies Subject,
          ],
        })),
      updateSubject: (id, patch) => mutate((s) => ({ ...s, subjects: replace(s.subjects, id, patch) })),
      deleteSubject: (id) =>
        mutate((s) => ({ ...s, subjects: replace(s.subjects, id, { deleted: true } as Partial<Subject>) })),
      addGrade: (subjectId, grade) =>
        mutate((s) => ({
          ...s,
          subjects: s.subjects.map((sub) =>
            sub.id === subjectId ? stamp({ ...sub, notes: [...(sub.notes ?? []), { ...grade, id: uid("note") }] }) : sub,
          ),
        })),
      deleteGrade: (subjectId, gradeId) =>
        mutate((s) => ({
          ...s,
          subjects: s.subjects.map((sub) =>
            sub.id === subjectId ? stamp({ ...sub, notes: (sub.notes ?? []).filter((n) => n.id !== gradeId) }) : sub,
          ),
        })),

      addExam: (title, subjectId, date) =>
        mutate((s) => ({
          ...s,
          exams: [...s.exams, { id: uid("exam"), title, subjectId, date, updatedAt: nowIso() } satisfies Exam],
        })),
      deleteExam: (id) => mutate((s) => ({ ...s, exams: replace(s.exams, id, { deleted: true } as Partial<Exam>) })),

      addEvent: (data) =>
        mutate((s) => ({
          ...s,
          events: [
            ...s.events,
            { ...data, id: uid("evt"), createdAt: nowIso(), updatedAt: nowIso() } satisfies CalEvent,
          ],
        })),
      updateEvent: (id, patch) => mutate((s) => ({ ...s, events: replace(s.events, id, patch) })),
      toggleEventDone: (id) =>
        mutate((s) => ({
          ...s,
          events: s.events.map((e) => (e.id === id ? stamp({ ...e, done: !e.done }) : e)),
        })),
      // Suppression définitive (réalisé ou non) : tombstone propagé par le CRDT.
      deleteEvent: (id) =>
        mutate((s) => ({ ...s, events: replace(s.events, id, { deleted: true } as Partial<CalEvent>) })),

      updatePomodoro: (patch) =>
        mutate((s) => ({ ...s, pomodoro: { ...s.pomodoro, ...patch, updatedAt: nowIso() } })),
      logSession: (type, minutes) =>
        mutate((s) => ({
          ...s,
          pomodoro: {
            ...s.pomodoro,
            sessionsLog: [
              ...s.pomodoro.sessionsLog,
              { id: uid("sess"), date: dayKey(), type, minutes, updatedAt: nowIso() } satisfies PomoSession,
            ],
          },
        })),

      addWeightEntry: (kg, date, note) =>
        mutate((s) => {
          const existing = s.weight.entries.find((e) => e.date === date && !e.deleted);
          const entries = existing
            ? s.weight.entries.map((e) => (e.id === existing.id ? stamp({ ...e, kg, note }) : e))
            : [
                ...s.weight.entries,
                { id: uid("w"), kg, date, note, photoId: null, updatedAt: nowIso() } satisfies WeightEntry,
              ];
          return { ...s, weight: { ...s.weight, entries } };
        }),
      deleteWeightEntry: (id) =>
        mutate((s) => ({
          ...s,
          weight: {
            ...s.weight,
            entries: s.weight.entries.map((e) => (e.id === id ? stamp({ ...e, deleted: true }) : e)),
          },
        })),
      uploadPhoto: async (dataUrl, caption, date) => {
        const c = codeRef.current;
        if (!c) return;
        const res = await fetch(`/api/space/${c}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataBase64: dataUrl, caption, date, mime: "image/jpeg" }),
        });
        if (!res.ok) throw new Error("upload failed");
        await pull();
      },
      deletePhoto: async (id) => {
        // Retrait optimiste : la vignette disparaît immédiatement.
        const snapshot = photos;
        setPhotos((p) => p.filter((x) => x.id !== id));
        setStatus("syncing");
        try {
          const res = await fetch(`/api/photos/${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("delete failed");
          // Réaligne la galerie sur le serveur et propage aux autres appareils.
          await pull();
        } catch (error) {
          setPhotos(snapshot); // rollback si le réseau a échoué
          setStatus("offline");
          throw error;
        }
      },

      updateSettings: (patch) =>
        mutate((s) => ({ ...s, settings: { ...s.settings, ...patch, updatedAt: nowIso() } })),
      setAccent: (accent, preset) =>
        mutate((s) => ({
          ...s,
          settings: { ...s.settings, theme: { ...s.settings.theme, accent, preset }, updatedAt: nowIso() },
        })),
      setThemeMode: (mode) =>
        mutate((s) => ({
          ...s,
          settings: { ...s.settings, theme: { ...s.settings.theme, mode }, updatedAt: nowIso() },
        })),
      setBackground: (background) =>
        mutate((s) => ({
          ...s,
          settings: { ...s.settings, theme: { ...s.settings.theme, background }, updatedAt: nowIso() },
        })),

      toggleHomeWidget: (id) =>
        mutate((s) => ({
          ...s,
          settings: {
            ...s.settings,
            home: normalizeHome(s.settings.home).map((w) =>
              w.id === id ? { ...w, enabled: !w.enabled } : w,
            ),
            updatedAt: nowIso(),
          },
        })),
      moveHomeWidget: (id, direction) =>
        mutate((s) => {
          const list = normalizeHome(s.settings.home);
          const index = list.findIndex((w) => w.id === id);
          const target = index + direction;
          if (index < 0 || target < 0 || target >= list.length) return s;
          const next = [...list];
          [next[index], next[target]] = [next[target], next[index]];
          return { ...s, settings: { ...s.settings, home: next, updatedAt: nowIso() } };
        }),
      resetHomeLayout: () =>
        mutate((s) => ({
          ...s,
          settings: { ...s.settings, home: HOME_DEFAULT.map((w) => ({ ...w })), updatedAt: nowIso() },
        })),
      joinSpace: async (raw) => {
        const target = raw.trim().toLowerCase();
        if (!/^zen-[a-z0-9]{3,8}-[a-z0-9]{3,8}-[a-z0-9]{3,8}$/.test(target)) return false;
        try {
          setStatus("syncing");
          const res = await fetch(`/api/space/${target}`, { cache: "no-store" });
          if (!res.ok) throw new Error("join failed");
          const json = (await res.json()) as { state: ZState; photos: PhotoMeta[] };
          const remote = normalizeState(json.state, target);
          localStorage.setItem(LS_CODE, target);
          dirty.current = false;
          mutationVersion.current = 0;
          codeRef.current = target;
          const joined = { ...remote, settings: { ...remote.settings, spaceCode: target } };
          stateRef.current = joined;
          setCode(target);
          setState(joined);
          setPhotos(json.photos ?? []);
          setStatus("synced");
          setLastSync(new Date().toISOString());
          return true;
        } catch {
          setStatus("offline");
          return false;
        }
      },
      newSpace: async () => {
        const fresh = makeSpaceCode();
        const blank = defaultState(fresh);
        localStorage.setItem(LS_CODE, fresh);
        codeRef.current = fresh;
        stateRef.current = blank;
        mutationVersion.current = 0;
        dirty.current = false;
        setCode(fresh);
        setState(blank);
        setPhotos([]);
        setStatus("syncing");
        try {
          const res = await fetch(`/api/space/${fresh}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ state: blank }),
          });
          if (!res.ok) throw new Error("create failed");
          const json = (await res.json()) as { state: ZState; photos: PhotoMeta[] };
          if (codeRef.current !== fresh) return;
          const remote = normalizeState(json.state, fresh);
          stateRef.current = remote;
          setState(remote);
          setPhotos(json.photos ?? []);
          setLastSync(new Date().toISOString());
          setStatus("synced");
        } catch {
          mutationVersion.current += 1;
          dirty.current = true;
          setStatus("offline");
        }
      },
      syncNow: () => void (dirty.current ? push() : pull()),
      exportBackup: () => {
        const blob = new Blob([JSON.stringify({ ...state, photos }, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `zenith-sauvegarde-${dayKey()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },
    };
  }, [state, photos, ready, status, lastSync, code, mutate, push, pull]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useZenith(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useZenith doit être utilisé dans ZenithProvider");
  return ctx;
}
