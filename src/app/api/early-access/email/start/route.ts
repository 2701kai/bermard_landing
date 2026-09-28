// POST {email, website}: sends a 6-digit sign-up code (rules in lib/gate/signup.ts). Public mode only, else 404.
import { type NextRequest, NextResponse } from "next/server";
import { publicMode } from "@/lib/gate/access";
import { clientIp, flowResponse, readJsonBody, requestLocale, sameOrigin } from "@/lib/gate/http";
import { OTP_COOKIE } from "@/lib/gate/session";
import { startEmail } from "@/lib/gate/signup";

export async function POST(req: NextRequest) {
  if (!publicMode()) return NextResponse.json({ ok: false }, { status: 404 });
  if (!sameOrigin(req)) return NextResponse.json({ ok: false }, { status: 403 });
  const body = await readJsonBody(req);
  if (body === "too_large") return NextResponse.json({ ok: false }, { status: 413 });
  if (!body) return NextResponse.json({ ok: false }, { status: 400 });
  const result = await startEmail({
    email: body.email,
    honeypot: body.website,
    locale: requestLocale(req),
    challenge: req.cookies.get(OTP_COOKIE)?.value,
    ip: clientIp(req),
  });
  return flowResponse(req, result);
}
