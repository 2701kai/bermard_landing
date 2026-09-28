// POST (the sign-out forms): clears the session cookie, back to the gate page, or to /team with ?from=team.
import { type NextRequest, NextResponse } from "next/server";
import { GATE_PAGE, SESSION_COOKIE, TEAM_PAGE } from "@/lib/gate/session";

export async function POST(req: NextRequest) {
  const back = req.nextUrl.searchParams.get("from") === "team" ? TEAM_PAGE : GATE_PAGE;
  const res = NextResponse.redirect(new URL(back, req.url), 303);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
