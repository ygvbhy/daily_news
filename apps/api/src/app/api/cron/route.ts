import { NextRequest, NextResponse } from "next/server";
import { runDailyCrawl, runDailyReport } from "@daily-news/core";

function authorized(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true;
  const header = req.headers.get("authorization");
  return header === `Bearer ${expected}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const crawl = await runDailyCrawl();
  const report = await runDailyReport();

  return NextResponse.json({ ok: true, crawl, report });
}
