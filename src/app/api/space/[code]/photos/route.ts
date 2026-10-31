import { NextResponse } from "next/server";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { photos } from "@/db/schema";
import { dayKey } from "@/lib/calc";
import { uid } from "@/lib/types";

export const dynamic = "force-dynamic";

const CODE_RE = /^zen-[a-z0-9]{3,8}-[a-z0-9]{3,8}-[a-z0-9]{3,8}$/;

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  await ensureSchema();
  const { code: rawCode } = await ctx.params;
  const code = decodeURIComponent(rawCode).trim().toLowerCase();
  if (!CODE_RE.test(code)) {
    return NextResponse.json({ error: "Code d'espace invalide" }, { status: 400 });
  }

  let body: { dataBase64?: string; mime?: string; caption?: string; date?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const data = (body.dataBase64 ?? "").replace(/^data:[^;]+;base64,/, "");
  if (!data || data.length > 8_000_000) {
    return NextResponse.json({ error: "Image manquante ou trop volumineuse" }, { status: 400 });
  }

  const id = uid("photo");
  await db.insert(photos).values({
    id,
    spaceCode: code,
    caption: (body.caption ?? "").slice(0, 200),
    date: body.date && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : dayKey(),
    mime: body.mime === "image/png" ? "image/png" : "image/jpeg",
    dataBase64: data,
  });

  return NextResponse.json({ id });
}
