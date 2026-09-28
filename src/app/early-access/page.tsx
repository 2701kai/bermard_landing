// The early-access gate page. Closed mode (default): kicker, headline, lede and the closed line.
// Public mode (GATE_PUBLIC=on): the sign-up view without a session, the waitlist view with an early-adopter session.
// Both end on a quiet link to /team, the staff sign-in.
// A team session never lands here (src/proxy.ts redirects it to `next`; the check below covers GATE=off).
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { GateShell, HEADLINE, Kicker, LEDE } from "@/components/gate/GateShell";
import { GoogleButton } from "@/components/gate/GoogleButton";
import { GATE_COPY, type GateCopy } from "@/content/early-access";
import { isTeamEmail, publicMode } from "@/lib/gate/access";
import { LANG_COOKIE, type Locale, pickLocale } from "@/lib/gate/locale";
import { OFFSET } from "@/lib/gate/registry";
import { SESSION_COOKIE, sanitizeNextPath, TEAM_PAGE, verifySession } from "@/lib/gate/session";

export const metadata: Metadata = {
  title: "BEVMAQ · Early Access",
  robots: { index: false, follow: false },
};

export default async function EarlyAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next: rawNext } = await searchParams;
  const next = sanitizeNextPath(Array.isArray(rawNext) ? rawNext[0] : rawNext);
  const jar = await cookies();
  const locale = pickLocale(jar.get(LANG_COOKIE)?.value, (await headers()).get("accept-language"));
  const session = verifySession(jar.get(SESSION_COOKIE)?.value);
  if (session && isTeamEmail(session.email)) redirect(next);
  const isPublic = publicMode();

  const t = GATE_COPY[locale];
  const teamHref = next === "/" ? TEAM_PAGE : `${TEAM_PAGE}?next=${encodeURIComponent(next)}`;

  return (
    <GateShell
      locale={locale}
      next={next}
      footer={
        <a
          href={teamHref}
          className="font-mono text-[12px] tracking-[0.04em] text-dim no-underline underline-offset-4 transition-colors hover:text-muted hover:underline"
        >
          {t.teamEntry}
        </a>
      }
    >
      {!isPublic ? (
        <ClosedView t={t} />
      ) : session && session.number !== null ? (
        <WaitlistView t={t} email={session.email} number={session.number + OFFSET} />
      ) : (
        <GateView t={t} next={next} locale={locale} />
      )}
    </GateShell>
  );
}

function ClosedView({ t }: { t: GateCopy }) {
  return (
    <>
      <Kicker>{t.kicker}</Kicker>
      <h1 className={`${HEADLINE} mt-5 text-orange`}>{t.headline}</h1>
      <p className={`${LEDE} mt-7`}>{t.lede}</p>
      <p className="m-0 mt-4 text-[16px] leading-[1.6] text-muted sm:text-[17px]">{t.closedLine}</p>
    </>
  );
}

function GateView({ t, next, locale }: { t: GateCopy; next: string; locale: Locale }) {
  return (
    <>
      <Kicker>{t.kicker}</Kicker>
      <h1 className={`${HEADLINE} mt-5 text-orange`}>{t.headline}</h1>
      <p className={`${LEDE} mt-7`}>{t.lede}</p>
      <p className="m-0 mt-4 text-[16px] leading-[1.6] text-muted sm:text-[17px]">{t.scarcity}</p>
      <p className="m-0 mt-6 font-mono text-[12.5px] tracking-[0.06em] text-blue-soft">{t.fair}</p>
      <div className="mt-9">
        <GoogleButton
          next={next}
          locale={locale}
          text="signup_with"
          errorText={t.error}
          notConfiguredText={t.notConfigured}
        />
      </div>
      <p className="m-0 mt-8 max-w-[520px] text-[12.5px] leading-[1.6] text-dim">
        {t.fine}
        <a
          href={t.privacyUrl}
          className="text-muted underline decoration-line underline-offset-4 hover:text-text"
          rel="noopener"
        >
          {t.privacyLink}
        </a>
        .
      </p>
    </>
  );
}

function WaitlistView({ t, email, number }: { t: GateCopy; email: string; number: number }) {
  return (
    <>
      <Kicker>{t.waitKicker}</Kicker>
      <h1 className={`${HEADLINE} mt-5`}>{t.waitHeadline}</h1>
      <div className="mt-9 flex flex-col gap-1 border-l-2 border-orange/60 pl-5">
        <p className="m-0 font-mono text-[12px] tracking-[0.14em] text-muted uppercase">{t.waitNumberLabel}</p>
        <p className="m-0 font-display text-[clamp(96px,22vw,184px)] leading-[0.85] font-black text-orange tabular-nums">
          {number}
        </p>
      </div>
      <p className={`${LEDE} mt-9`}>{t.waitBody}</p>
      <form
        method="post"
        action="/api/early-access/signout"
        className="m-0 mt-10 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[12px] text-dim"
      >
        <span>
          {t.signedInAs} <span className="break-all text-muted">{email}</span>
        </span>
        <span aria-hidden="true">·</span>
        <button
          type="submit"
          className="cursor-pointer border-0 bg-transparent p-0 font-mono text-[12px] text-blue-soft underline-offset-4 hover:text-text hover:underline"
        >
          {t.signOut}
        </button>
      </form>
    </>
  );
}
