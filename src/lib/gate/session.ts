// Early-access session: an HMAC-SHA256 signed cookie, no session store.
// Ported from BEVMAQ_OS lib/auth.ts (signSession / verifySession / sanitizeNextPath).
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "bmea_landing";
export const SESSION_DAYS = 30;
const SESSION_MS = SESSION_DAYS * 86_400_000;

export const GATE_PAGE = "/early-access";
export const TEAM_PAGE = "/team";

/** number: the early adopter's seq index (displayed + OFFSET), null for a team session. exp: epoch ms. */
export type Session = { email: string; name: string; number: number | null; exp: number };

function envSecret(): string | null {
  return process.env.GATE_SESSION_SECRET || null;
}

function hmac(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function signSession(
  data: Omit<Session, "exp">,
  now: number = Date.now(),
  secret: string | null = envSecret(),
): string {
  if (!secret) throw new Error("GATE_SESSION_SECRET is not set");
  const session: Session = { email: data.email, name: data.name, number: data.number, exp: now + SESSION_MS };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${hmac(payload, secret)}`;
}

/** Null for a missing, tampered, malformed or expired cookie, and when no secret is configured (nobody gets in). */
export function verifySession(
  value: string | undefined | null,
  now: number = Date.now(),
  secret: string | null = envSecret(),
): Session | null {
  if (!value || !secret) return null;
  const dot = value.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = value.slice(0, dot);
  const a = Buffer.from(value.slice(dot + 1));
  const b = Buffer.from(hmac(payload, secret));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const s = JSON.parse(Buffer.from(payload, "base64url").toString()) as Partial<Session>;
    if (typeof s.email !== "string" || !s.email || typeof s.exp !== "number" || now > s.exp) return null;
    const number = typeof s.number === "number" && Number.isInteger(s.number) ? s.number : null;
    return { email: s.email, name: typeof s.name === "string" ? s.name : "", number, exp: s.exp };
  } catch {
    return null;
  }
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
