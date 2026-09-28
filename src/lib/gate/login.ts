// Sign-in with a Google Identity Services credential, framework-free so the mode rules are testable.
// Team gets a session without a number. Public mode registers everyone else once as an early adopter; closed mode
// (the default) gives a non-team account nothing: no registration, no number, no session. The staff sign-in
// (/team, intent 'team') gives a non-team account nothing in either mode and says why (reason 'not_team').
import { type GoogleClaims, loginDecision, publicMode } from "./access";
import { verifyGoogleIdToken } from "./google";
import type { Locale } from "./locale";
import { sendWelcomeMail } from "./mail";
import { notifyTelegram, registerPerson } from "./registry";
import { GATE_PAGE, type Session, sanitizeNextPath } from "./session";

export type LoginResult =
  | { status: 200; redirect: string; session: Omit<Session, "exp"> }
  | { status: 401 | 403 | 503; reason?: "not_team"; redirect?: undefined; session?: undefined };

export type LoginDeps = {
  verify?: (credential: string) => Promise<GoogleClaims>;
  register?: typeof registerPerson;
  notify?: typeof notifyTelegram;
  welcome?: typeof sendWelcomeMail;
  isPublic?: boolean;
  allow?: string;
};

export async function login(
  input: { credential: string; next: string | null; host: string; locale: Locale; intent?: "team" },
  deps: LoginDeps = {},
): Promise<LoginResult> {
  const verify = deps.verify ?? verifyGoogleIdToken;
  let claims: GoogleClaims;
  try {
    claims = await verify(input.credential);
  } catch (e) {
    console.warn("[early-access] credential rejected", e instanceof Error ? e.message : "unknown");
    return { status: 401 };
  }

  const decision = loginDecision(claims, deps.allow ?? process.env.GATE_ALLOW);
  if (decision !== "team" && input.intent === "team") return { status: 403, reason: "not_team" };
  if (decision === "reject") return { status: 403 };
  if (decision === "team") {
    return {
      status: 200,
      redirect: sanitizeNextPath(input.next),
      session: { id: claims.email, name: claims.name, number: null },
    };
  }
  if (!(deps.isPublic ?? publicMode())) return { status: 403 };

  const register = deps.register ?? registerPerson;
  const notify = deps.notify ?? notifyTelegram;
  try {
    const who = {
      email: claims.email,
      name: claims.name,
      host: input.host,
      locale: input.locale,
      source: "google" as const,
      verified: true,
    };
    const r = await register(who);
    if (r.first) {
      await Promise.all([
        notify({ ...who, number: r.number }),
        (deps.welcome ?? sendWelcomeMail)({ ...who, number: r.number }),
      ]);
    }
    return { status: 200, redirect: GATE_PAGE, session: { id: claims.email, name: claims.name, number: r.number } };
  } catch (e) {
    console.error("[early-access] registration failed", e instanceof Error ? e.message : "unknown");
    return { status: 503 };
  }
}
