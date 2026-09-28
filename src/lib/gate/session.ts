// Early-access session: an HMAC-SHA256 signed cookie, no session store. The e-mail code challenge (otp.ts) uses the
// same sealed-JSON format under its own cookie. Ported from BEVMAQ_OS lib/auth.ts (signSession / verifySession /
// sanitizeNextPath).
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "bmea_landing";
export const OTP_COOKIE = `${SESSION_COOKIE}_otp`;
export const SESSION_DAYS = 30;
const SESSION_MS = SESSION_DAYS * 86_400_000;

export const GATE_PAGE = "/early-access";
export const TEAM_PAGE = "/team";

/** id: the lowercased email (Google, e-mail code) or the E.164 phone number (callback request).
 *  number: the early adopter's seq index (displayed + OFFSET), null for a team session. exp: epoch ms. */
export type Session = { id: string; name: string; number: number | null; exp: number };

export function envSecret(): string | null {
  return process.env.GATE_SESSION_SECRET || null;
}

function hmac(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** `<base64url(JSON)>.<HMAC-SHA256>`. */
export function sealJson(data: object, secret: string): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${hmac(payload, secret)}`;
}

/** The parsed object when the signature holds, else null. No expiry check: the caller owns its fields. */
export function openJson<T>(value: string | undefined | null, secret: string | null): Partial<T> | null {
  if (!value || !secret) return null;
  const dot = value.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = value.slice(0, dot);
  const a = Buffer.from(value.slice(dot + 1));
  const b = Buffer.from(hmac(payload, secret));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as unknown;
    return data && typeof data === "object" ? (data as Partial<T>) : null;
  } catch {
    return null;
  }
}

export function signSession(
  data: Omit<Session, "exp">,
  now: number = Date.now(),
  secret: string | null = envSecret(),
): string {
  if (!secret) throw new Error("GATE_SESSION_SECRET is not set");
  const session: Session = { id: data.id, name: data.name, number: data.number, exp: now + SESSION_MS };
  return sealJson(session, secret);
}

/** Null for a missing, tampered, malformed or expired cookie, and when no secret is configured (nobody gets in). */
export function verifySession(
  value: string | undefined | null,
  now: number = Date.now(),
  secret: string | null = envSecret(),
): Session | null {
  const s = openJson<Session>(value, secret);
  if (!s || typeof s.id !== "string" || !s.id || typeof s.exp !== "number" || now > s.exp) return null;
  const number = typeof s.number === "number" && Number.isInteger(s.number) ? s.number : null;
  return { id: s.id, name: typeof s.name === "string" ? s.name : "", number, exp: s.exp };
}

/** Secure on every Vercel deployment and any https origin; off only for plain-http local runs. */
export function cookieSecure(url: URL): boolean {
  return Boolean(process.env.VERCEL_ENV) || url.protocol === "https:";
}

/** httpOnly, lax, host-only (no Domain attribute). */
export function sessionCookieOptions(secure: boolean) {
  return { httpOnly: true, sameSite: "lax" as const, secure, path: "/", maxAge: SESSION_DAYS * 86_400 };
}

/** Open-redirect guard for the `next` deep-link param: one relative path starting with a single '/'.
 *  Protocol-relative ('//host'), absolute ('http://'), backslash ('/\host', which URL parsers read as '//host')
 *  and control characters fall back to '/'; so do the gate and team pages themselves (a redirect loop). */
export function sanitizeNextPath(raw: string | null | undefined): string {
  if (!raw) return "/";
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return "/";
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.includes("://")) return "/";
  // biome-ignore lint/suspicious/noControlCharactersInRegex: rejecting control characters is the point
  if (/[\\\u0000-\u001f\u007f]/.test(decoded)) return "/";
  for (const page of [GATE_PAGE, TEAM_PAGE]) {
    if (decoded === page || decoded.startsWith(`${page}?`) || decoded.startsWith(`${page}/`)) return "/";
  }
  return decoded;
}
