import { pool } from "@/db";

const globalForSchema = globalThis as typeof globalThis & {
  __zenithSchemaReady?: Promise<void>;
};

/**
 * Initialisation idempotente au premier appel API.
 * Drizzle reste utilisé pour toutes les interactions applicatives ; ce garde-fou
 * rend simplement un déploiement neuf utilisable avec la seule DATABASE_URL.
 */
export function ensureSchema(): Promise<void> {
  if (!globalForSchema.__zenithSchemaReady) {
    globalForSchema.__zenithSchemaReady = pool
      .query(`
        create table if not exists spaces (
          code text primary key,
          data jsonb not null,
          rev integer not null default 1,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        );

        create table if not exists photos (
          id text primary key,
          space_code text not null,
          caption text not null default '',
          date text not null,
          mime text not null default 'image/jpeg',
          data_base64 text not null,
          deleted integer not null default 0,
          created_at timestamptz not null default now()
        );

        create index if not exists photos_space_idx on photos (space_code);

        create table if not exists events (
          id text primary key,
          space_code text not null,
          title text not null,
          description text not null default '',
          date text not null,
          start text not null default '09:00',
          "end" text not null default '10:00',
          location text not null default '',
          url text not null default '',
          photo_id text,
          done integer not null default 0,
          deleted integer not null default 0,
          updated_at timestamptz not null default now()
        );

        create index if not exists events_space_date_idx on events (space_code, date);
      `)
      .then(() => undefined)
      .catch((error: unknown) => {
        // Autorise une nouvelle tentative après une coupure temporaire de la base.
        globalForSchema.__zenithSchemaReady = undefined;
        throw error;
      });
  }
  return globalForSchema.__zenithSchemaReady;
}
