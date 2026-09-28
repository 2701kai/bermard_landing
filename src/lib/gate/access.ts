// Who gets through the early-access gate. Access is recomputed from the session's email on every request,
// so adding someone to GATE_ALLOW lets them in without a new sign-in.

/** GATE=off passes everything; any other value, or none, keeps the gate on. */
export function gateOn(value: string | undefined = process.env.GATE): boolean {
  return value?.trim() !== "off";
}

/** GATE_PUBLIC=on is public mode (early-adopter sign-up, waitlist view). Anything else is closed mode: team only,
 *  and a non-team session is ignored, so registration, numbers and the waitlist view stay dormant. */
export function publicMode(value: string | undefined = process.env.GATE_PUBLIC): boolean {
  return value?.trim() === "on";
}

export function parseAllow(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

const TEAM_DOMAIN = "bevmaq.com";

/** Team by the session id: a @bevmaq.com email or one on GATE_ALLOW. A phone id (no '@') is never team. */
export function isTeamEmail(email: string, allowRaw: string | undefined = process.env.GATE_ALLOW): boolean {
  const e = email.trim().toLowerCase();
  if (!e.includes("@")) return false;
  return e.endsWith(`@${TEAM_DOMAIN}`) || parseAllow(allowRaw).has(e);
}

export type GoogleClaims = { email: string; email_verified: boolean; hd: string | null; name: string };

/** The sign-in decision on a verified Google ID token. An unverified email never gets a session. A @bevmaq.com
 *  address whose token carries a different hosted domain is refused outright rather than registered, because the
 *  per-request check sees only the email and would otherwise let it in as team (as BEVMAQ_OS lib/auth.ts does). */
export function loginDecision(
  c: GoogleClaims,
  allowRaw: string | undefined = process.env.GATE_ALLOW,
): "team" | "waitlist" | "reject" {
  const email = c.email.trim().toLowerCase();
  if (!c.email_verified || !email.includes("@")) return "reject";
  if (parseAllow(allowRaw).has(email)) return "team";
  if (email.endsWith(`@${TEAM_DOMAIN}`)) return c.hd && c.hd !== TEAM_DOMAIN ? "reject" : "team";
  return "waitlist";
}
