import {
  Base,
  EPOCH,
  Pomodoro,
  Settings,
  WeightState,
  ZState,
  defaultState,
} from "./types";

function newer(a: string | undefined, b: string | undefined): boolean {
  return (a ?? EPOCH) >= (b ?? EPOCH);
}

export function mergeList<T extends Base>(local: T[], remote: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of local ?? []) {
    if (item && item.id) map.set(item.id, item);
  }
  for (const item of remote ?? []) {
    if (!item || !item.id) continue;
    const existing = map.get(item.id);
    if (!existing || !newer(existing.updatedAt, item.updatedAt)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

function mergeScalar<T extends { updatedAt: string }>(local: T, remote: T): T {
  return newer(local?.updatedAt, remote?.updatedAt) ? local : remote;
}

export function mergeState(local: ZState, remote: ZState): ZState {
  const l = normalizeState(local, local?.settings?.spaceCode ?? "");
  const r = normalizeState(remote, l.settings.spaceCode);

  const pomoBase = mergeScalar<Pomodoro>(l.pomodoro, r.pomodoro);
  const weightBase = mergeScalar<WeightState>(l.weight, r.weight);

  return {
    tasks: mergeList(l.tasks, r.tasks),
    tags: mergeList(l.tags, r.tags),
    habits: mergeList(l.habits, r.habits),
    habitCategories: mergeList(l.habitCategories, r.habitCategories),
    subjects: mergeList(l.subjects, r.subjects),
    exams: mergeList(l.exams, r.exams),
    pomodoro: {
      ...pomoBase,
      sessionsLog: mergeList(l.pomodoro.sessionsLog, r.pomodoro.sessionsLog),
    },
    weight: {
      ...weightBase,
      entries: mergeList(l.weight.entries, r.weight.entries),
    },
    settings: mergeScalar<Settings>(l.settings, r.settings),
  };
}

/** Nettoie un état venant du réseau / localStorage (données non fiables). */
export function normalizeState(raw: unknown, spaceCode: string): ZState {
  const base = defaultState(spaceCode);
  if (!raw || typeof raw !== "object") return base;
  const s = raw as Partial<ZState>;
  const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  return {
    tasks: arr(s.tasks),
    tags: arr<(typeof base.tags)[number]>(s.tags).length ? arr(s.tags) : base.tags,
    habits: arr(s.habits),
    habitCategories: arr<(typeof base.habitCategories)[number]>(s.habitCategories).length
      ? arr(s.habitCategories)
      : base.habitCategories,
    subjects: arr<(typeof base.subjects)[number]>(s.subjects).map((sub) => ({
      ...sub,
      notes: Array.isArray(sub.notes) ? sub.notes : [],
    })),
    exams: arr(s.exams),
    pomodoro: {
      ...base.pomodoro,
      ...(s.pomodoro ?? {}),
      sessionsLog: arr(s.pomodoro?.sessionsLog),
    },
    weight: {
      ...base.weight,
      ...(s.weight ?? {}),
      entries: arr(s.weight?.entries),
    },
    settings: {
      ...base.settings,
      ...(s.settings ?? {}),
      theme: { ...base.settings.theme, ...(s.settings?.theme ?? {}) },
      spaceCode: spaceCode || s.settings?.spaceCode || base.settings.spaceCode,
    },
  };
}

/** Enlève les tombstones trop vieux pour éviter l'inflation du JSON. */
export function pruneState(state: ZState): ZState {
  const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString();
  const keep = <T extends Base>(items: T[]) =>
    items.filter((i) => !(i.deleted && (i.updatedAt ?? EPOCH) < cutoff));
  return {
    ...state,
    tasks: keep(state.tasks),
    tags: keep(state.tags),
    habits: keep(state.habits),
    habitCategories: keep(state.habitCategories),
    subjects: keep(state.subjects),
    exams: keep(state.exams),
    pomodoro: { ...state.pomodoro, sessionsLog: keep(state.pomodoro.sessionsLog) },
    weight: { ...state.weight, entries: keep(state.weight.entries) },
  };
}

export function live<T extends Base>(items: T[]): T[] {
  return (items ?? []).filter((i) => !i.deleted);
}
