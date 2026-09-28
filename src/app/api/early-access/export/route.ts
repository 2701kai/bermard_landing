// GET: the early-adopter registry as CSV for a team session (401 without a session, 403 for any other session).
import { type NextRequest, NextResponse } from "next/server";
import { exportPeople } from "@/lib/gate/export";
import { SESSION_COOKIE } from "@/lib/gate/session";

export async function GET(req: NextRequest) {
  const r = await exportPeople(req.cookies.get(SESSION_COOKIE)?.value);
  if (r.status !== 200) return NextResponse.json(r.json, { status: r.status });
  return new NextResponse(r.csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${r.filename}"`,
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
