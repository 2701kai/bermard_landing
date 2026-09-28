// POST {name, phone, website}: a callback request, registered unverified (lib/gate/signup.ts). Public mode only, else 404.
import { type NextRequest, NextResponse } from "next/server";
import { publicMode } from "@/lib/gate/access";
import { flowResponse, readJsonBody, requestHost, requestLocale, sameOrigin } from "@/lib/gate/http";
import { submitPhone } from "@/lib/gate/signup";

export async function POST(req: NextRequest) {
  if (!publicMode()) return NextResponse.json({ ok: false }, { status: 404 });
  if (!sameOrigin(req)) return NextResponse.json({ ok: false }, { status: 403 });
  const body = await readJsonBody(req);
  if (body === "too_large") return NextResponse.json({ ok: false }, { status: 413 });
  if (!body) return NextResponse.json({ ok: false }, { status: 400 });
  const result = await submitPhone({
    name: body.name,
    phone: body.phone,
    honeypot: body.website,
    host: requestHost(req),
    locale: requestLocale(req),
  });
  return flowResponse(req, result);
}
