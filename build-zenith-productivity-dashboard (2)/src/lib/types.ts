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

export interface Habit extends Base {
  name: string;
  category: string; // habitCategory id
  history: string[]; // ["2026-09-12", ...]
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

export interface ThemeState {
  preset: string;
  accent: string;
}

export interface Settings {
  userName: string;
  dailyPointsGoal: number;
  spaceCode: string;
  theme: ThemeState;
  notifications: boolean;
  updatedAt: string;
}

export interface ZState {
  tasks: Task[];
  tags: Tag[];
  habits: Habit[];
  habitCategories: HabitCategory[];
  subjects: Subject[];
  exams: Exam[];
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
      theme: { preset: "lime-nuit", accent: "#C6F000" },
      notifications: false,
      updatedAt: t,
    },
  };
}
