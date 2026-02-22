import { NextRequest, NextResponse } from "next/server";

export function requireAdmin(req: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD;
  const provided = req.headers.get("x-admin-token");

  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
