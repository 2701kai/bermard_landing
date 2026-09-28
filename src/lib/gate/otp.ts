// E-mail sign-up code (also the double opt-in): a random 6-digit code, the challenge kept stateless in a sealed
// httpOnly cookie (session.ts OTP_COOKIE) holding the email, an HMAC of the code, expiry, tries and send time.
// Replay of an old cookie (a lower tries count) is caught by registry.ts claimOtpAttempt.
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { envSecret, openJson, sealJson } from "./session";

export const OTP_TTL_MS = 15 * 60_000;
export const OTP_RESEND_MS = 60_000;
export const OTP_MAX_TRIES = 5;

/** cid: challenge id (the replay ledger key). h: HMAC of the code. exp, sent: epoch ms. */
export type Challenge = { cid: string; email: string; h: string; exp: number; sent: number; tries: number };

export function newCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function codeHash(email: string, code: string, secret: string): string {
  return createHmac("sha256", secret).update(`otp:${email}:${code}`).digest("base64url");
}

export function createChallenge(
  email: string,
  code: string,
  now: number = Date.now(),
  secret: string | null = envSecret(),
): { challenge: Challenge; cookie: string } {
  if (!secret) throw new Error("GATE_SESSION_SECRET is not set");
  const challenge: Challenge = {
    cid: randomBytes(12).toString("base64url"),
    email,
    h: codeHash(email, code, secret),
    exp: now + OTP_TTL_MS,
    sent: now,
    tries: 0,
  };
  return { challenge, cookie: sealJson(challenge, secret) };
}

/** The challenge when its signature holds (expired or not: checkCode decides), else null. */
export function readChallenge(value: string | undefined | null, secret: string | null = envSecret()): Challenge | null {
  const c = openJson<Challenge>(value, secret);
  if (
    !c ||
    typeof c.cid !== "string" ||
    typeof c.email !== "string" ||
    typeof c.h !== "string" ||
    typeof c.exp !== "number" ||
    typeof c.sent !== "number" ||
    typeof c.tries !== "number"
  )
    return null;
  return { cid: c.cid, email: c.email, h: c.h, exp: c.exp, sent: c.sent, tries: c.tries };
}

export function resendAllowed(c: Challenge | null, email: string, now: number = Date.now()): boolean {
  return !c || c.email !== email || now - c.sent >= OTP_RESEND_MS;
}

/** expired: past its 15 minutes or out of tries. Otherwise a constant-time compare of the code's HMAC. */
export function checkCode(
  c: Challenge,
  code: string,
  now: number = Date.now(),
  secret: string | null = envSecret(),
): "ok" | "wrong" | "expired" {
  if (!secret) throw new Error("GATE_SESSION_SECRET is not set");
  if (now > c.exp || c.tries >= OTP_MAX_TRIES) return "expired";
  if (!/^\d{6}$/.test(code)) return "wrong";
  const a = Buffer.from(codeHash(c.email, code, secret));
  const b = Buffer.from(c.h);
  return a.length === b.length && timingSafeEqual(a, b) ? "ok" : "wrong";
}

/** The cookie after one more wrong try. */
export function bumpTries(c: Challenge, secret: string | null = envSecret()): string {
  if (!secret) throw new Error("GATE_SESSION_SECRET is not set");
  return sealJson({ ...c, tries: c.tries + 1 }, secret);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trimmed and lowercased, or null when it does not look like an address (or is over 254 characters). */
export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const e = raw.trim().toLowerCase();
  return e.length <= 254 && EMAIL_RE.test(e) ? e : null;
}
