export type Priority = "haute" | "moyenne" | "basse";

export interface Base {
  id: string;
  updatedAt: string;
  deleted?: boolean;
}

export interface Task extends Base {
  title: string;
  priority: Priority;
  tag: string; // tag id ("" = aucune)
  done: boolean;
  archived: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface Tag extends Base {
  name: string;
  color: string;
}

/** 0 = Dimanche, 1 = Lundi, … 6 = Samedi (aligné sur Date.getDay()). */
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const ALL_DAYS: WeekDay[] = [1, 2, 3, 4, 5, 6, 0];
export const WEEKDAYS: WeekDay[] = [1, 2, 3, 4, 5];
export const WEEKEND: WeekDay[] = [6, 0];
export const DAY_LABELS: Record<WeekDay, string> = { 1: "L", 2: "M", 3: "M", 4: "J", 5: "V", 6: "S", 0: "D" };

export interface Habit extends Base {
  name: string;
  category: string; // habitCategory id
  history: string[]; // ["2026-09-12", ...]
  /** Jours ciblés. Vide/absent = tous les jours (rétrocompatible). */
  targetDays?: WeekDay[];
  createdAt: string;
}

export interface CalEvent extends Base {
  title: string;
  description: string;
  date: string; // yyyy-mm-dd
  start: string; // HH:MM
  end: string; // HH:MM
  location: string;
  url: string;
  photoId: string | null;
  done: boolean;
  createdAt: string;
}

export interface HabitCategory extends Base {
  name: string;
  color: string;
}

export interface Grade {
  id: string;
  title: string;
  grade: number;
  coeff: number;
  date: string;
}

export interface Subject extends Base {
  name: string;
  color: string;
  manualAverage: number | null;
  useManual: boolean;
  notes: Grade[];
}

export interface Exam extends Base {
  title: string;
  subjectId: string;
  date: string; // yyyy-mm-dd
}

export interface PomoSession extends Base {
  date: string; // yyyy-mm-dd
  type: "focus" | "short" | "long";
  minutes: number;
}

export interface Pomodoro {
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  sessionsBeforeLongBreak: number;
  dailyGoalMin: number;
  updatedAt: string;
  sessionsLog: PomoSession[];
}

export interface WeightEntry extends Base {
  date: string;
  kg: number;
  note: string;
  photoId?: string | null;
}

export interface WeightState {
  goal: number | null;
  updatedAt: string;
  entries: WeightEntry[];
}

export type ThemeMode = "auto" | "light" | "dark";

export interface ThemeState {
  preset: string;
  accent: string;
  /** "auto" bascule en sombre le soir/nuit (>=20h ou <7h). */
  mode: ThemeMode;
  /** Couleur de fond personnalisée, null = fond par défaut du mode. */
  background: string | null;
}

/** Un élément de la grille d'accueil personnalisable (style iOS). */
export interface HomeItem {
  id: string;
  enabled: boolean;
}

export const HOME_DEFAULT: HomeItem[] = [
  { id: "clock", enabled: true },
  { id: "shortcuts", enabled: true },
  { id: "tasks", enabled: true },
  { id: "habits", enabled: true },
  { id: "score", enabled: true },
  { id: "focus", enabled: true },
  { id: "agenda", enabled: true },
];

export interface Settings {
  userName: string;
  dailyPointsGoal: number;
  spaceCode: string;
  theme: ThemeState;
  notifications: boolean;
  /** Ordre + visibilité des widgets de l'accueil. */
  home: HomeItem[];
  updatedAt: string;
}

export interface ZState {
  tasks: Task[];
  tags: Tag[];
  habits: Habit[];
  habitCategories: HabitCategory[];
  subjects: Subject[];
  exams: Exam[];
  events: CalEvent[];
  pomodoro: Pomodoro;
  weight: WeightState;
  settings: Settings;
}

export interface PhotoMeta {
  id: string;
  caption: string;
  date: string;
  createdAt: string;
}

export const EPOCH = "1970-01-01T00:00:00.000Z";

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function makeSpaceCode(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const block = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `zen-${block()}-${block()}-${block()}`;
}

const PALETTE = ["#C6F000", "#FF6B8B", "#FFB020", "#4FA8FF", "#B07CFF", "#4BE3A2"];

export function defaultState(spaceCode: string): ZState {
  // Les valeurs par défaut sont horodatées à l'époque zéro : ainsi, lors d'une
  // fusion, toute donnée réellement saisie par l'utilisateur l'emporte toujours.
  const t = EPOCH;
  const tagNames = ["Études", "Sport", "Lecture", "Personnel", "Projet"];
  const habitNames = ["Sport", "Lecture", "Études", "Bien-être"];
  return {
    tasks: [],
    tags: tagNames.map((name, i) => ({
      id: `tag_default_${i}`,
      name,
      color: PALETTE[i % PALETTE.length],
      updatedAt: t,
    })),
    habits: [],
    habitCategories: habitNames.map((name, i) => ({
      id: `hcat_default_${i}`,
      name,
      color: PALETTE[(i + 1) % PALETTE.length],
      updatedAt: t,
    })),
    subjects: [],
    exams: [],
    events: [],
    pomodoro: {
      focusMin: 25,
      shortBreakMin: 5,
      longBreakMin: 15,
      sessionsBeforeLongBreak: 4,
      dailyGoalMin: 120,
      updatedAt: t,
      sessionsLog: [],
    },
    weight: { goal: null, updatedAt: t, entries: [] },
    settings: {
      userName: "Alex",
      dailyPointsGoal: 6,
      spaceCode,
      theme: { preset: "lime-nuit", accent: "#C6F000", mode: "auto", background: null },
      notifications: false,
      home: HOME_DEFAULT.map((w) => ({ ...w })),
      updatedAt: t,
    },
  };
}
