import { live } from "./merge";
import { ALL_DAYS, CalEvent, Habit, Priority, Subject, Task, WeekDay, ZState } from "./types";

export const PRIORITY_POINTS: Record<Priority, number> = {
  haute: 3,
  moyenne: 2,
  basse: 1,
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  haute: "HAUTE",
  moyenne: "MOYENNE",
  basse: "BASSE",
};

export function dayKey(d: Date | string = new Date()): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(key: string, delta: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + delta);
  return dayKey(date);
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function frDate(key: string, opts?: Intl.DateTimeFormatOptions): string {
  return parseKey(key).toLocaleDateString("fr-FR", opts ?? { day: "numeric", month: "long", year: "numeric" });
}

export function frShort(key: string): string {
  return parseKey(key).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

export function daysUntil(key: string): number {
  const today = parseKey(dayKey());
  const target = parseKey(key);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

/* ------------------------------- Productivité ------------------------------ */

export function pointsForDay(tasks: Task[], key: string): { points: number; count: number } {
  let points = 0;
  let count = 0;
  for (const t of live(tasks)) {
    if (!t.done || !t.completedAt) continue;
    if (dayKey(t.completedAt) !== key) continue;
    points += PRIORITY_POINTS[t.priority] ?? 1;
    count += 1;
  }
  return { points, count };
}

/* Socle = habitudes (principal) · Booster = tâches + équilibre (secondaire) */
export const BASE_MAX = 16;
export const BOOSTER_MAX = 4;
const BOOSTER_TASKS_MAX = 3;
const BOOSTER_BALANCE_MAX = 1;

export interface ScoreBreakdown {
  score: number;
  base: number;
  booster: number;
  tasks: number;
  taskPoints: number;
  habitsDone: number;
  habitsTotal: number;
  categories: number;
}

/** Habitudes actives ce jour-là (une habitude ne compte pas avant sa création). */
/**
 * Habitudes **attendues** ce jour-là : créées avant ou le jour même, et dont le
 * jour de la semaine fait partie des jours ciblés. Une habitude de week-end
 * n'apparaît donc pas — et ne pénalise pas la note — un mardi.
 */
export function habitsOnDay(state: ZState, key: string) {
  return live(state.habits).filter(
    (h) => (!h.createdAt || dayKey(h.createdAt) <= key) && isHabitDue(h, key),
  );
}

export function scoreBreakdownForDay(state: ZState, key: string): ScoreBreakdown {
  // --- Socle : les habitudes portent l'essentiel de la note (16 points) ---
  const habits = habitsOnDay(state, key);
  const habitsTotal = habits.length;
  const habitsDone = habits.filter((h) => (h.history ?? []).includes(key)).length;
  const base = habitsTotal > 0 ? (habitsDone / habitsTotal) * BASE_MAX : 0;

  // --- Booster : tâches du jour, plafonné à 3 points ---
  const completed = live(state.tasks).filter(
    (t) => t.done && t.completedAt && dayKey(t.completedAt) === key,
  );
  const taskPoints = completed.reduce((sum, t) => sum + (PRIORITY_POINTS[t.priority] ?? 1), 0);
  const goal = Math.max(1, state.settings.dailyPointsGoal || 6);
  const taskPart = Math.min(BOOSTER_TASKS_MAX, (taskPoints / goal) * BOOSTER_TASKS_MAX);

  // --- Booster : équilibre inter-catégories, plafonné à 1 point ---
  const categories = new Set(completed.map((t) => t.tag).filter(Boolean)).size;
  const balanceRatio = categories >= 3 ? 1 : categories === 2 ? 0.7 : categories === 1 ? 0.35 : 0;
  const booster = Math.min(BOOSTER_MAX, taskPart + balanceRatio * BOOSTER_BALANCE_MAX);

  return {
    score: Math.min(20, base + booster),
    base,
    booster,
    tasks: completed.length,
    taskPoints,
    habitsDone,
    habitsTotal,
    categories,
  };
}

export function scoreForDay(state: ZState, key: string): { score: number; tasks: number } {
  const b = scoreBreakdownForDay(state, key);
  return { score: b.score, tasks: b.tasks };
}

export function mention(score: number): string {
  if (score < 8) return "Insuffisant";
  if (score < 11) return "Passable";
  if (score < 13) return "Assez bien";
  if (score < 15) return "Bien";
  if (score < 17) return "Très bien";
  return "Excellent";
}

export function scoreMention(score: number): string {
  if (score <= 0) return "Aucune activité";
  if (score < 8) return "À renforcer";
  if (score < 13) return "En progrès";
  if (score < 17) return "Solide";
  return "Excellent";
}

export function scoreColor(score: number): string {
  if (score < 8) return "#FF5C7A";
  if (score < 13) return "#FFB020";
  return "#4BE3A2";
}

export function lastNDays(n: number, endKey = dayKey()): string[] {
  return Array.from({ length: n }, (_, i) => addDays(endKey, -(n - 1 - i)));
}

/* --------------------------------- Habitudes -------------------------------- */

/** Jours ciblés d'une habitude ; vide/absent = tous les jours. */
export function habitTargetDays(habit: Habit): WeekDay[] {
  const days = habit.targetDays;
  return days && days.length ? days : ALL_DAYS;
}

/** L'habitude est-elle attendue ce jour-là ? */
export function isHabitDue(habit: Habit, key: string): boolean {
  return habitTargetDays(habit).includes(parseKey(key).getDay() as WeekDay);
}

/**
 * Série = jours **ciblés** consécutifs validés.
 * Les jours non ciblés sont ignorés : une habitude de week-end ne casse pas
 * sa série parce qu'on est mardi.
 */
export function habitStreak(habit: Habit): number {
  const set = new Set(habit.history ?? []);
  const created = habit.createdAt ? dayKey(habit.createdAt) : null;
  let streak = 0;
  let cursor = dayKey();

  // Un jour ciblé encore en cours et non validé ne casse pas la série.
  if (isHabitDue(habit, cursor) && !set.has(cursor)) cursor = addDays(cursor, -1);

  // Garde-fou : 2 ans d'historique au maximum.
  for (let guard = 0; guard < 730; guard++) {
    if (created && cursor < created) break;
    if (!isHabitDue(habit, cursor)) {
      cursor = addDays(cursor, -1); // jour non ciblé : neutre
      continue;
    }
    if (!set.has(cursor)) break;
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function bestGlobalStreak(habits: Habit[]): number {
  const days = new Set<string>();
  for (const h of live(habits)) for (const d of h.history ?? []) days.add(d);
  const sorted = Array.from(days).sort();
  let best = 0;
  let current = 0;
  let prev = "";
  for (const d of sorted) {
    current = prev && addDays(prev, 1) === d ? current + 1 : 1;
    best = Math.max(best, current);
    prev = d;
  }
  return best;
}

export function habitsDoneToday(habits: Habit[]): number {
  const key = dayKey();
  return live(habits).filter((h) => isHabitDue(h, key) && (h.history ?? []).includes(key)).length;
}

/** Taux sur 7 jours, calculé uniquement sur les occurrences attendues. */
export function habitWeekRate(habits: Habit[]): number {
  const list = live(habits);
  if (!list.length) return 0;
  const days = lastNDays(7);
  let due = 0;
  let done = 0;
  for (const h of list) {
    for (const d of days) {
      if (!isHabitDue(h, d)) continue;
      due += 1;
      if ((h.history ?? []).includes(d)) done += 1;
    }
  }
  return due === 0 ? 0 : Math.round((done / due) * 100);
}

/* --------------------------------- Agenda ---------------------------------- */

/** Minutes depuis minuit pour un "HH:MM" (tri à la minute près). */
export function minutesOf(time: string): number {
  const [h, m] = (time || "0:0").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function eventsOnDay(events: CalEvent[], key: string): CalEvent[] {
  return live(events)
    .filter((e) => e.date === key)
    .sort((a, b) => minutesOf(a.start) - minutesOf(b.start));
}

/** Prochains événements à venir (aujourd'hui non terminés, puis jours suivants). */
export function upcomingEvents(events: CalEvent[], limit = 2): CalEvent[] {
  const today = dayKey();
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  return live(events)
    .filter((e) => {
      if (e.done) return false;
      if (e.date > today) return true;
      return e.date === today && minutesOf(e.end) >= nowMin;
    })
    .sort((a, b) => (a.date === b.date ? minutesOf(a.start) - minutesOf(b.start) : a.date.localeCompare(b.date)))
    .slice(0, limit);
}

/** Grille du mois : 6 semaines commençant un lundi. */
export function monthGrid(year: number, month: number): string[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // lundi = 0
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return dayKey(d);
  });
}

/* ---------------------------------- Études --------------------------------- */

export function subjectAverage(subject: Subject): number | null {
  if (subject.useManual && typeof subject.manualAverage === "number") return subject.manualAverage;
  return computedSubjectAverage(subject);
}

export function computedSubjectAverage(subject: Subject): number | null {
  const notes = subject.notes ?? [];
  if (!notes.length) return null;
  const totalCoeff = notes.reduce((s, n) => s + (Number(n.coeff) || 0), 0);
  if (totalCoeff <= 0) return null;
  const sum = notes.reduce((s, n) => s + (Number(n.grade) || 0) * (Number(n.coeff) || 0), 0);
  return sum / totalCoeff;
}

export function subjectCoeffTotal(subject: Subject): number {
  return (subject.notes ?? []).reduce((s, n) => s + (Number(n.coeff) || 0), 0);
}

export function generalAverage(subjects: Subject[]): { average: number | null; noteCount: number } {
  const list = live(subjects);
  const values: number[] = [];
  let noteCount = 0;
  for (const s of list) {
    noteCount += (s.notes ?? []).length;
    const avg = subjectAverage(s);
    if (avg !== null) values.push(avg);
  }
  if (!values.length) return { average: null, noteCount };
  return { average: values.reduce((a, b) => a + b, 0) / values.length, noteCount };
}

/* ---------------------------------- Focus ---------------------------------- */

export function focusMinutesForDay(state: ZState, key = dayKey()): number {
  return live(state.pomodoro.sessionsLog)
    .filter((s) => s.type === "focus" && s.date === key)
    .reduce((sum, s) => sum + (Number(s.minutes) || 0), 0);
}

export function focusSessionsForDay(state: ZState, key = dayKey()): number {
  return live(state.pomodoro.sessionsLog).filter((s) => s.type === "focus" && s.date === key).length;
}

/* ---------------------------------- Divers --------------------------------- */

export function formatNum(n: number, digits = 2): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

export const QUOTES: { text: string; author: string }[] = [
  { text: "Ce n'est pas que le temps nous manque, c'est que nous en gaspillons beaucoup.", author: "Sénèque" },
  { text: "La discipline est le pont entre les objectifs et les accomplissements.", author: "Jim Rohn" },
  { text: "Il ne s'agit pas d'avoir le temps, il s'agit de le prendre.", author: "Charles Buxton" },
  { text: "Ce que nous faisons chaque jour compte plus que ce que nous faisons de temps en temps.", author: "Gretchen Rubin" },
  { text: "Commence par faire le nécessaire, puis le possible ; et soudain tu feras l'impossible.", author: "François d'Assise" },
  { text: "Un petit progrès chaque jour finit par créer de grands résultats.", author: "Satya Nani" },
  { text: "La concentration est la racine de toutes les capacités supérieures de l'homme.", author: "Bruce Lee" },
  { text: "Ne comptez pas les jours, faites que les jours comptent.", author: "Mohamed Ali" },
];

export function quoteOfTheDay(seedKey = dayKey()): { text: string; author: string } {
  let hash = 0;
  for (let i = 0; i < seedKey.length; i++) hash = (hash * 31 + seedKey.charCodeAt(i)) % 100000;
  return QUOTES[hash % QUOTES.length];
}
