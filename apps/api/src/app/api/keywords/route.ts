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

function withCors(req: NextRequest, res: NextResponse) {
  const allowOrigin = process.env.CORS_ORIGIN || "*";
  res.headers.set("Access-Control-Allow-Origin", allowOrigin);
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, x-admin-token, Authorization"
  );
  if (allowOrigin !== "*") {
    res.headers.set("Vary", "Origin");
  }
  return res;
}

export async function OPTIONS(req: NextRequest) {
  return withCors(req, new NextResponse(null, { status: 204 }));
}

export async function GET(req: NextRequest) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return withCors(req, unauthorized);

  const keywords = await listKeywords();
  return withCors(
    req,
    NextResponse.json({
      keywords: keywords.map((keyword) => ({
        id: keyword.id,
        term: keyword.term,
        active: keyword.active
      }))
    })
  );
}

export async function POST(req: NextRequest) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return withCors(req, unauthorized);

  const body = await req.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return withCors(
      req,
      NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    );
  }

  await replaceKeywords(parsed.data.keywords);
  return withCors(req, NextResponse.json({ ok: true }));
}
