// Public-mode sign-up without Google, framework-free so the rules are testable: an e-mail code (also the double
// opt-in) and a phone callback request. Closed mode answers 404. A filled honeypot answers 200 and does nothing.
// A verified @bevmaq.com (or GATE_ALLOW) email is team, as with Google; a phone number never is.
import { isTeamEmail, publicMode } from "./access";
import type { Locale } from "./locale";
import { codeCopy, sendCodeMail, sendWelcomeMail } from "./mail";
import { bumpTries, checkCode, createChallenge, newCode, normalizeEmail, readChallenge, resendAllowed } from "./otp";
import { normalizePhone } from "./phone";
import { claimCodeMailQuota, claimOtpAttempt, notifyTelegram, type Registrant, registerPerson } from "./registry";
import { envSecret, GATE_PAGE, type Session, sanitizeNextPath } from "./session";

export type FlowResult = {
  status: number;
  body: { ok: boolean; reason?: string; redirect?: string };
  session?: Omit<Session, "exp">;
  /** A new challenge cookie, or null to clear it; undefined leaves it alone. */
  otp?: string | null;
};

export type FlowDeps = {
  isPublic?: boolean;
  register?: typeof registerPerson;
  notify?: typeof notifyTelegram;
  send?: (to: string, code: string, locale: Locale) => Promise<unknown>;
  welcome?: typeof sendWelcomeMail;
  claimAttempt?: (cid: string, n: number) => Promise<boolean>;
  /** The server-side send limits (registry.ts claimCodeMailQuota). */
  quota?: (email: string, ip: string, now: number) => Promise<boolean>;
  allow?: string;
  now?: number;
  secret?: string | null;
};

const NOT_FOUND: FlowResult = { status: 404, body: { ok: false } };
const HONEYPOT: FlowResult = { status: 200, body: { ok: true } };

function filled(honeypot: unknown): boolean {
  return typeof honeypot === "string" && honeypot.trim() !== "";
}

function defaultSend(to: string, code: string, locale: Locale) {
  return sendCodeMail(to, code, locale, codeCopy(locale));
}

async function registerAndSession(who: Registrant, deps: FlowDeps): Promise<FlowResult> {
  const register = deps.register ?? registerPerson;
  const notify = deps.notify ?? notifyTelegram;
  try {
    const r = await register(who);
    if (r.first) {
      const welcome = deps.welcome ?? sendWelcomeMail;
      await Promise.all([
        notify({ ...who, number: r.number }),
        who.email && who.verified ? welcome({ ...who, email: who.email, number: r.number }) : null,
      ]);
    }
    const id = who.email ?? who.phone ?? "";
    return { status: 200, body: { ok: true, redirect: GATE_PAGE }, session: { id, name: who.name, number: r.number } };
  } catch (e) {
    console.error("[early-access] registration failed", e instanceof Error ? e.message : "unknown");
    return { status: 503, body: { ok: false } };
  }
}

/** POST {email, website}: a new 6-digit code by mail (or the dry-run log), the challenge in the returned cookie.
 *  A resend for the same address waits 60 s (cookie), and the server-side limits per address and per IP apply. */
export async function startEmail(
  input: { email: unknown; honeypot: unknown; locale: Locale; challenge: string | undefined; ip: string },
  deps: FlowDeps = {},
): Promise<FlowResult> {
  if (!(deps.isPublic ?? publicMode())) return NOT_FOUND;
  if (filled(input.honeypot)) return HONEYPOT;
  const email = normalizeEmail(input.email);
  if (!email) return { status: 400, body: { ok: false, reason: "invalid_email" } };
  const secret = deps.secret === undefined ? envSecret() : deps.secret;
  const now = deps.now ?? Date.now();
  if (!resendAllowed(readChallenge(input.challenge, secret), email, now)) {
    return { status: 429, body: { ok: false, reason: "wait" } };
  }
  try {
    const quota = deps.quota ?? ((e, ip, t) => claimCodeMailQuota(e, ip, { now: t }));
    if (!(await quota(email, input.ip, now))) return { status: 429, body: { ok: false, reason: "rate_limited" } };
  } catch (e) {
    console.error("[early-access] code mail limit check failed", e instanceof Error ? e.message : "unknown");
    return { status: 503, body: { ok: false } };
  }
  const code = newCode();
  const { cookie } = createChallenge(email, code, now, secret);
  try {
    await (deps.send ?? defaultSend)(email, code, input.locale);
  } catch (e) {
    console.error("[early-access] code mail failed", e instanceof Error ? e.message : "unknown");
    return { status: 502, body: { ok: false } };
  }
  return { status: 200, body: { ok: true }, otp: cookie };
}

/** POST {code, next, website}: at most 5 tries within 15 minutes; a right code registers (source email, verified)
 *  or, for a team address, signs in to `next`. */
export async function verifyEmail(
  input: {
    code: unknown;
    honeypot: unknown;
    next: unknown;
    host: string;
    locale: Locale;
    challenge: string | undefined;
  },
  deps: FlowDeps = {},
): Promise<FlowResult> {
  if (!(deps.isPublic ?? publicMode())) return NOT_FOUND;
  if (filled(input.honeypot)) return HONEYPOT;
  const secret = deps.secret === undefined ? envSecret() : deps.secret;
  const c = readChallenge(input.challenge, secret);
  if (!c) return { status: 400, body: { ok: false, reason: "expired" }, otp: null };
  const code = typeof input.code === "string" ? input.code.replace(/\s/g, "") : "";
  const verdict = checkCode(c, code, deps.now ?? Date.now(), secret);
  if (verdict === "expired") return { status: 410, body: { ok: false, reason: "expired" }, otp: null };
  if (verdict === "wrong") {
    let fresh: boolean;
    try {
      fresh = await (deps.claimAttempt ?? ((cid, n) => claimOtpAttempt(cid, n)))(c.cid, c.tries);
    } catch (e) {
      console.error("[early-access] code attempt ledger failed", e instanceof Error ? e.message : "unknown");
      return { status: 503, body: { ok: false } };
    }
    // A replayed cookie (its tries count was already used) spends the challenge.
    if (!fresh) return { status: 410, body: { ok: false, reason: "expired" }, otp: null };
    return { status: 400, body: { ok: false, reason: "wrong" }, otp: bumpTries(c, secret) };
  }

  if (isTeamEmail(c.email, deps.allow ?? process.env.GATE_ALLOW)) {
    const next = sanitizeNextPath(typeof input.next === "string" ? input.next : null);
    return {
      status: 200,
      body: { ok: true, redirect: next },
      session: { id: c.email, name: "", number: null },
      otp: null,
    };
  }
  const who: Registrant = {
    email: c.email,
    name: "",
    host: input.host,
    locale: input.locale,
    source: "email",
    verified: true,
  };
  return { ...(await registerAndSession(who, deps)), otp: null };
}

/** POST {name, phone, website}: a callback request (no SMS). Registers source phone, unverified; never team. */
export async function submitPhone(
  input: { name: unknown; phone: unknown; honeypot: unknown; host: string; locale: Locale },
  deps: FlowDeps = {},
): Promise<FlowResult> {
  if (!(deps.isPublic ?? publicMode())) return NOT_FOUND;
  if (filled(input.honeypot)) return HONEYPOT;
  const phone = normalizePhone(input.phone);
  if (!phone) return { status: 400, body: { ok: false, reason: "invalid_phone" } };
  const name = typeof input.name === "string" ? input.name.trim().slice(0, 120) : "";
  if (!name) return { status: 400, body: { ok: false, reason: "invalid_name" } };
  return registerAndSession(
    { phone, name, host: input.host, locale: input.locale, source: "phone", verified: false },
    deps,
  );
}
