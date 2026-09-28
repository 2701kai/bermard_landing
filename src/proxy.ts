// Early-access gate (Next 16 proxy, Node runtime by default). GATE=off passes everything.
// No session: pages redirect to /early-access?next=<path>, /api/* answers 401. Team (lib/gate/access.ts, decided per
// request): through. Waitlist session, public mode only (GATE_PUBLIC=on): pages redirect to /early-access (the
// waitlist view), /api/* answers 403; closed mode ignores a non-team session, so it counts as no session.
import { type NextRequest, NextResponse } from "next/server";
import { gateOn, isTeamEmail, publicMode } from "@/lib/gate/access";
import { GATE_PAGE, SESSION_COOKIE, sanitizeNextPath, TEAM_PAGE, teamLanding, verifySession } from "@/lib/gate/session";

const PUBLIC_PREFIXES = ["/api/early-access/"];

function noindex(res: NextResponse): NextResponse {
  res.headers.set("x-robots-tag", "noindex, nofollow");
  return res;
}

export function proxy(req: NextRequest) {
  if (!gateOn()) return NextResponse.next();
  const { pathname, search } = req.nextUrl;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();
  // The staff sign-in is always reachable, a team session included (it shows the signed-in state and sign-out).
  if (pathname === TEAM_PAGE) return noindex(NextResponse.next());

  const verified = verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const team = verified !== null && isTeamEmail(verified.id);
  const session = team || publicMode() ? verified : null;

  if (pathname === GATE_PAGE) {
    if (team)
      return noindex(NextResponse.redirect(new URL(teamLanding(req.nextUrl.searchParams.get("next")), req.url)));
    return noindex(NextResponse.next());
  }
  if (team) return noindex(NextResponse.next());

  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return noindex(
      session
        ? NextResponse.json({ error: "early access only" }, { status: 403 })
        : NextResponse.json({ error: "sign-in required" }, { status: 401 }),
    );
  }
  const url = new URL(GATE_PAGE, req.url);
  if (!session) {
    const next = sanitizeNextPath(pathname + search);
    if (next !== "/") url.searchParams.set("next", next);
  }
  return noindex(NextResponse.redirect(url));
}

export const config = {
  // Static assets stay out of the proxy: build output, next/font files (under _next/static), icons, robots.
  matcher: ["/((?!_next/static|_next/image|__nextjs|_vercel|favicon\\.ico|icon\\.svg|robots\\.txt).*)"],
};
