// The early-access gate page. Closed mode (default): the closed view with a quiet team sign-in entry.
// Public mode (GATE_PUBLIC=on): the sign-up view without a session, the waitlist view with an early-adopter session.
// A team session never lands here (src/proxy.ts redirects it to `next`; the check below covers GATE=off).
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { GATE_COPY, type GateCopy } from "@/content/early-access";
import { isTeamEmail, publicMode } from "@/lib/gate/access";
import { LANG_COOKIE, LOCALES, type Locale, pickLocale } from "@/lib/gate/locale";
import { OFFSET } from "@/lib/gate/registry";
import { SESSION_COOKIE, sanitizeNextPath, verifySession } from "@/lib/gate/session";
import s from "./early-access.module.css";
import { GoogleButton } from "./GoogleButton";
import { TeamEntry } from "./TeamEntry";

export const metadata: Metadata = {
  title: "BEVMAQ · Early Access",
  robots: { index: false, follow: false },
};

const STATUS = "PRIVATE PREVIEW · CIBUS TEC 2026";

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
  const nextQs = next === "/" ? "" : `&next=${encodeURIComponent(next)}`;

  return (
    <div lang={locale} className={`${s.page} flex min-h-dvh flex-col bg-ink-0 font-body text-text`}>
      <header className="mx-auto flex w-full max-w-[1080px] items-start justify-between gap-4 px-4 pt-6 sm:px-8 sm:pt-9">
        <div className="flex flex-col gap-2.5">
          <span className="font-display text-[30px] leading-none font-black tracking-[0.05em] sm:text-[34px]">
            BEVMAQ
          </span>
          <p className="m-0 flex items-center gap-2.5 font-mono text-[11px] leading-none tracking-[0.14em] text-muted uppercase">
            <span aria-hidden="true" className={`${s.dot} inline-block h-2 w-2 shrink-0 rounded-full bg-orange`} />
            {STATUS}
          </p>
        </div>
        <nav aria-label="Language" className="flex items-center gap-1 font-mono text-[12px] tracking-[0.08em]">
          {LOCALES.map((l) => (
            <a
              key={l}
              href={`/api/early-access/lang?l=${l}${nextQs}`}
              hrefLang={l}
              aria-current={l === locale ? "true" : undefined}
              className={`rounded-full px-2.5 py-1.5 no-underline transition-colors ${
                l === locale
                  ? "border border-blue/40 bg-blue/10 text-blue-soft"
                  : "border border-transparent text-dim hover:text-text"
              }`}
            >
              {l.toUpperCase()}
            </a>
          ))}
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col justify-center px-4 py-14 sm:px-8 sm:py-20">
        <div className="flex max-w-[680px] flex-col">
          {!isPublic ? (
            <ClosedView t={t} />
          ) : session && session.number !== null ? (
            <WaitlistView t={t} email={session.email} number={session.number + OFFSET} />
          ) : (
            <GateView t={t} next={next} locale={locale} />
          )}
        </div>
      </main>

      {!isPublic && (
        <footer className="mx-auto w-full max-w-[1080px] px-4 pb-8 sm:px-8 sm:pb-10">
          <TeamEntry
            label={t.teamEntry}
            next={next}
            locale={locale}
            errorText={t.error}
            notConfiguredText={t.notConfigured}
          />
        </footer>
      )}
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="m-0 font-mono text-[11.5px] leading-snug font-medium tracking-[0.18em] text-blue-soft uppercase">
      {children}
    </p>
  );
}

const HEADLINE =
  "m-0 font-display text-[clamp(52px,11vw,112px)] leading-[0.92] font-extrabold tracking-[0.005em] text-balance";

function ClosedView({ t }: { t: GateCopy }) {
  return (
    <>
      <Kicker>{t.kicker}</Kicker>
      <h1 className={`${HEADLINE} mt-5 text-orange`}>{t.headline}</h1>
      <p className="m-0 mt-7 text-[18px] leading-[1.55] text-text sm:text-[20px]">{t.lede}</p>
      <p className="m-0 mt-4 text-[16px] leading-[1.6] text-muted sm:text-[17px]">{t.closedLine}</p>
    </>
  );
}

function GateView({ t, next, locale }: { t: GateCopy; next: string; locale: Locale }) {
  return (
    <>
      <Kicker>{t.kicker}</Kicker>
      <h1 className={`${HEADLINE} mt-5 text-orange`}>{t.headline}</h1>
      <p className="m-0 mt-7 text-[18px] leading-[1.55] text-text sm:text-[20px]">{t.lede}</p>
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
      <p className="m-0 mt-9 text-[18px] leading-[1.55] text-text sm:text-[20px]">{t.waitBody}</p>
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
