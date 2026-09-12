import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { photos } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await ctx.params;
  const rows = await db.select().from(photos).where(eq(photos.id, id)).limit(1);
  if (!rows.length || rows[0].deleted === 1) {
    return NextResponse.json({ error: "Photo introuvable" }, { status: 404 });
  }
  const buffer = Buffer.from(rows[0].dataBase64, "base64");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": rows[0].mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await ctx.params;
  await db.update(photos).set({ deleted: 1 }).where(eq(photos.id, id));
  return NextResponse.json({ ok: true });
}
