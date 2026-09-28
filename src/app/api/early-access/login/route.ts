// POST {credential, next}: a Google Identity Services credential -> session cookie (rules in lib/gate/login.ts).
import { type NextRequest, NextResponse } from "next/server";
import { LANG_COOKIE, pickLocale } from "@/lib/gate/locale";
import { login } from "@/lib/gate/login";
import { cookieSecure, SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/gate/session";

function fail(status: number) {
  return NextResponse.json({ ok: false }, { status });
}

export async function POST(req: NextRequest) {
  const host = req.headers.get("host") ?? req.nextUrl.host;
  const origin = req.headers.get("origin");
  if (origin) {
    let originHost = "";
    try {
      originHost = new URL(origin).host;
    } catch {}
    if (originHost !== host) return fail(403);
  }

  let body: { credential?: unknown; next?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail(400);
  }
  if (typeof body.credential !== "string" || !body.credential) return fail(400);

  const result = await login({
    credential: body.credential,
    next: typeof body.next === "string" ? body.next : null,
    host,
    locale: pickLocale(req.cookies.get(LANG_COOKIE)?.value, req.headers.get("accept-language")),
  });
  if (!result.session) return fail(result.status);

  const res = NextResponse.json({ ok: true, redirect: result.redirect });
  res.cookies.set(SESSION_COOKIE, signSession(result.session), sessionCookieOptions(cookieSecure(req.nextUrl)));
  return res;
}
