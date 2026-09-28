// Route-handler plumbing for the sign-up forms: body-size limit, same-origin check, applying a FlowResult.
import { type NextRequest, NextResponse } from "next/server";
import { LANG_COOKIE, type Locale, pickLocale } from "./locale";
import { OTP_TTL_MS } from "./otp";
import { cookieSecure, OTP_COOKIE, SESSION_COOKIE, sessionCookieOptions, signSession } from "./session";
import type { FlowResult } from "./signup";

export const MAX_BODY_BYTES = 2048;
const OTP_PATH = "/api/early-access/email";

/** The JSON object body, "too_large" past MAX_BODY_BYTES (declared or actual), null when it is not a JSON object. */
export async function readJsonBody(req: NextRequest): Promise<Record<string, unknown> | "too_large" | null> {
  if (Number(req.headers.get("content-length") ?? "0") > MAX_BODY_BYTES) return "too_large";
  const text = await req.text();
  if (Buffer.byteLength(text) > MAX_BODY_BYTES) return "too_large";
  try {
    const v = JSON.parse(text) as unknown;
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** A browser POST carries Origin; one from another host is refused. */
export function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === (req.headers.get("host") ?? req.nextUrl.host);
  } catch {
    return false;
  }
}

export function requestHost(req: NextRequest): string {
  return req.headers.get("host") ?? req.nextUrl.host;
}

/** First hop of x-forwarded-for, else x-real-ip, else "unknown" (then all such requests share one IP budget). */
export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || req.headers.get("x-real-ip")?.trim() || "unknown";
}

export function requestLocale(req: NextRequest): Locale {
  return pickLocale(req.cookies.get(LANG_COOKIE)?.value, req.headers.get("accept-language"));
}

export function flowResponse(req: NextRequest, r: FlowResult): NextResponse {
  const res = NextResponse.json(r.body, { status: r.status });
  const secure = cookieSecure(req.nextUrl);
  if (r.session) res.cookies.set(SESSION_COOKIE, signSession(r.session), sessionCookieOptions(secure));
  if (r.otp !== undefined) {
    res.cookies.set(OTP_COOKIE, r.otp ?? "", {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: OTP_PATH,
      maxAge: r.otp ? OTP_TTL_MS / 1000 : 0,
    });
  }
  return res;
}
