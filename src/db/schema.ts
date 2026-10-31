import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { CalEvent, Habit, ZState } from "@/lib/types";

/**
 * Un "espace" Zenith = un code de synchronisation + l'état complet (JSON).
 * Aucun compte n'est nécessaire : le code d'espace sert de clé d'accès.
 *
 * `data` est typé `ZState`, qui contient notamment :
 *  - `habits[].targetDays` : jours ciblés d'une habitude (0=Dim … 6=Sam)
 *  - `events[]`            : agenda (voir la table `events` ci-dessous)
 */
export const spaces = pgTable("spaces", {
  code: text("code").primaryKey(),
  data: jsonb("data").$type<ZState>().notNull(),
  rev: integer("rev").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Projection relationnelle de l'agenda.
 * La source de vérité pour la synchro reste `spaces.data.events` (fusion CRDT),
 * cette table permet des requêtes serveur par date sans désérialiser tout l'état.
 */
export const events = pgTable(
  "events",
  {
    id: text("id").primaryKey(),
    spaceCode: text("space_code").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    date: text("date").notNull(), // yyyy-mm-dd
    start: text("start").notNull().default("09:00"), // HH:MM
    end: text("end").notNull().default("10:00"), // HH:MM
    location: text("location").notNull().default(""),
    url: text("url").notNull().default(""),
    photoId: text("photo_id"),
    done: integer("done").notNull().default(0),
    deleted: integer("deleted").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("events_space_date_idx").on(t.spaceCode, t.date)],
);

/**
 * Les photos (progression corporelle et pièces jointes d'événements) sont
 * stockées à part pour garder la charge utile de synchronisation légère.
 */
export const photos = pgTable(
  "photos",
  {
    id: text("id").primaryKey(),
    spaceCode: text("space_code").notNull(),
    caption: text("caption").notNull().default(""),
    date: text("date").notNull(),
    mime: text("mime").notNull().default("image/jpeg"),
    dataBase64: text("data_base64").notNull(),
    deleted: integer("deleted").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("photos_space_idx").on(t.spaceCode)],
);

export type HabitRow = Habit;
export type EventRow = CalEvent;
