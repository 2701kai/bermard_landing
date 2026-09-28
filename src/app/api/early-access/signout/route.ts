// POST (the waitlist view's sign-out form): clears the session cookie, back to the gate page.
import { type NextRequest, NextResponse } from "next/server";
import { GATE_PAGE, SESSION_COOKIE } from "@/lib/gate/session";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL(GATE_PAGE, req.url), 303);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
