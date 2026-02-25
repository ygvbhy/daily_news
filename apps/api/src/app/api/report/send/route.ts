import { NextRequest, NextResponse } from "next/server";
import { runDailyCrawl, runDailyEmailReport } from "@daily-news/core";
import { requireAdmin } from "@/lib/auth";

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/$/, "");
}

function isAllowedOrigin(origin: string, allowedOrigins: string[]) {
  return allowedOrigins.some((item) => {
    if (item === "*") return true;
    if (item.startsWith("*.")) {
      const suffix = item.slice(1);
      try {
        const url = new URL(origin);
        return url.hostname.endsWith(suffix);
      } catch {
        return false;
      }
    }
    return normalizeOrigin(item) === normalizeOrigin(origin);
  });
}

function resolveAllowOrigin(req: NextRequest) {
  const configured = (process.env.CORS_ORIGIN || "*")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const requestOrigin = req.headers.get("origin");

  if (configured.includes("*")) return "*";
  if (requestOrigin && isAllowedOrigin(requestOrigin, configured)) {
    return requestOrigin;
  }

  return configured[0] || "*";
}

function withCors(req: NextRequest, res: NextResponse) {
  const allowOrigin = resolveAllowOrigin(req);
  res.headers.set("Access-Control-Allow-Origin", allowOrigin);
  res.headers.set("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, x-admin-token, Authorization"
  );
  res.headers.set("Access-Control-Max-Age", "86400");
  res.headers.set("Vary", "Origin");
  return res;
}

export async function OPTIONS(req: NextRequest) {
  return withCors(req, new NextResponse(null, { status: 204 }));
}

export async function POST(req: NextRequest) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return withCors(req, unauthorized);

  try {
    const crawl = await runDailyCrawl();
    const report = await runDailyEmailReport();

    return withCors(
      req,
      NextResponse.json({
        ok: true,
        crawl,
        report
      })
    );
  } catch (error) {
    return withCors(
      req,
      NextResponse.json({ ok: false, error: "Failed to send report" }, { status: 500 })
    );
  }
}
