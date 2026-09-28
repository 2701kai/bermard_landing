// POST {code, next, website}: checks the sign-up code, then registers or signs in (lib/gate/signup.ts).
// Public mode only, else 404.
import { type NextRequest, NextResponse } from "next/server";
import { publicMode } from "@/lib/gate/access";
import { flowResponse, readJsonBody, requestHost, requestLocale, sameOrigin } from "@/lib/gate/http";
import { OTP_COOKIE } from "@/lib/gate/session";
import { verifyEmail } from "@/lib/gate/signup";

export async function POST(req: NextRequest) {
  if (!publicMode()) return NextResponse.json({ ok: false }, { status: 404 });
  if (!sameOrigin(req)) return NextResponse.json({ ok: false }, { status: 403 });
  const body = await readJsonBody(req);
  if (body === "too_large") return NextResponse.json({ ok: false }, { status: 413 });
  if (!body) return NextResponse.json({ ok: false }, { status: 400 });
  const result = await verifyEmail({
    code: body.code,
    honeypot: body.website,
    next: body.next,
    host: requestHost(req),
    locale: requestLocale(req),
    challenge: req.cookies.get(OTP_COOKIE)?.value,
  });
  return flowResponse(req, result);
}
