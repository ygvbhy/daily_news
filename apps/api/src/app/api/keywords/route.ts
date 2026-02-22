import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { listKeywords, replaceKeywords } from "@/lib/keywords";

const payloadSchema = z.object({
  keywords: z
    .array(
      z.object({
        term: z.string().min(1).max(100),
        active: z.boolean()
      })
    )
    .max(200)
});

export async function GET(req: NextRequest) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  const keywords = await listKeywords();
  return NextResponse.json({
    keywords: keywords.map((keyword) => ({
      id: keyword.id,
      term: keyword.term,
      active: keyword.active
    }))
  });
}

export async function POST(req: NextRequest) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await replaceKeywords(parsed.data.keywords);
  return NextResponse.json({ ok: true });
}
