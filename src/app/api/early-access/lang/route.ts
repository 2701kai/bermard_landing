// GET ?l=de|en|it&next=<path>[&from=team]: the DE/EN/IT switcher. Sets the `lang` cookie, back to the gate page
// (or to /team).
import { type NextRequest, NextResponse } from "next/server";
import { isLocale, LANG_COOKIE } from "@/lib/gate/locale";
import { cookieSecure, GATE_PAGE, sanitizeNextPath, TEAM_PAGE } from "@/lib/gate/session";

export async function GET(req: NextRequest) {
  const l = req.nextUrl.searchParams.get("l");
  const next = sanitizeNextPath(req.nextUrl.searchParams.get("next"));
  const url = new URL(req.nextUrl.searchParams.get("from") === "team" ? TEAM_PAGE : GATE_PAGE, req.url);
  if (next !== "/") url.searchParams.set("next", next);
  const res = NextResponse.redirect(url, 303);
  if (isLocale(l)) {
    res.cookies.set(LANG_COOKIE, l, {
      sameSite: "lax",
      secure: cookieSecure(req.nextUrl),
      path: "/",
      maxAge: 365 * 86_400,
    });
  }
  return res;
}
