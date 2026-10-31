import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { photos, spaces } from "@/db/schema";
import { mergeState, normalizeState, pruneState } from "@/lib/merge";
import { defaultState, PhotoMeta, ZState } from "@/lib/types";

export const dynamic = "force-dynamic";

const CODE_RE = /^zen-[a-z0-9]{3,8}-[a-z0-9]{3,8}-[a-z0-9]{3,8}$/;

function cleanCode(raw: string): string | null {
  const code = decodeURIComponent(raw).trim().toLowerCase();
  return CODE_RE.test(code) ? code : null;
}

async function loadPhotos(code: string): Promise<PhotoMeta[]> {
  const rows = await db
    .select({
      id: photos.id,
      caption: photos.caption,
      date: photos.date,
      createdAt: photos.createdAt,
    })
    .from(photos)
    .where(and(eq(photos.spaceCode, code), eq(photos.deleted, 0)));
  return rows
    .map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

async function ensureSpace(code: string): Promise<{ state: ZState; rev: number }> {
  const rows = await db.select().from(spaces).where(eq(spaces.code, code)).limit(1);
  if (rows.length) {
    return { state: normalizeState(rows[0].data, code), rev: rows[0].rev };
  }
  const state = defaultState(code);
  await db.insert(spaces).values({ code, data: state, rev: 1 }).onConflictDoNothing();
  return { state, rev: 1 };
}

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  await ensureSchema();
  const { code: rawCode } = await ctx.params;
  const code = cleanCode(rawCode);
  if (!code) return NextResponse.json({ error: "Code d'espace invalide" }, { status: 400 });
  const { state, rev } = await ensureSpace(code);
  const photoList = await loadPhotos(code);
  return NextResponse.json({ state, rev, photos: photoList, serverTime: new Date().toISOString() });
}

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  await ensureSchema();
  const { code: rawCode } = await ctx.params;
  const code = cleanCode(rawCode);
  if (!code) return NextResponse.json({ error: "Code d'espace invalide" }, { status: 400 });

  let body: { state?: unknown };
  try {
    body = (await req.json()) as { state?: unknown };
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const incoming = normalizeState(body.state, code);
  const current = await ensureSpace(code);
  const merged = pruneState(mergeState(incoming, current.state));
  const rev = current.rev + 1;

  await db
    .insert(spaces)
    .values({ code, data: merged, rev })
    .onConflictDoUpdate({
      target: spaces.code,
      set: { data: merged, rev, updatedAt: new Date() },
    });

  const photoList = await loadPhotos(code);
  return NextResponse.json({ state: merged, rev, photos: photoList, serverTime: new Date().toISOString() });
}
