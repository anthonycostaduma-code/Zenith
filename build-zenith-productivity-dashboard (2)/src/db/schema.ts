import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Un "espace" Zenith = un code de synchronisation + l'état complet (JSON).
 * Aucun compte n'est nécessaire : le code d'espace sert de clé d'accès.
 */
export const spaces = pgTable("spaces", {
  code: text("code").primaryKey(),
  data: jsonb("data").notNull(),
  rev: integer("rev").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Les photos de progression sont stockées à part (base64 compressé côté client)
 * pour garder la charge utile de synchronisation légère.
 */
export const photos = pgTable("photos", {
  id: text("id").primaryKey(),
  spaceCode: text("space_code").notNull(),
  caption: text("caption").notNull().default(""),
  date: text("date").notNull(),
  mime: text("mime").notNull().default("image/jpeg"),
  dataBase64: text("data_base64").notNull(),
  deleted: integer("deleted").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
