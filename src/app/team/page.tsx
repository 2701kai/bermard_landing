// /team: the staff sign-in, always public (src/proxy.ts). A team session sees its signed-in state with Continue
// (to `next`) and Sign out; everyone else gets the Google button with intent 'team', which never registers anyone.
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { GateShell, HEADLINE, Kicker, LEDE } from "@/components/gate/GateShell";
import { GoogleButton } from "@/components/gate/GoogleButton";
import { GATE_COPY } from "@/content/early-access";
import { isTeamEmail } from "@/lib/gate/access";
import { LANG_COOKIE, pickLocale } from "@/lib/gate/locale";
import { GATE_PAGE, SESSION_COOKIE, sanitizeNextPath, verifySession } from "@/lib/gate/session";

export const metadata: Metadata = {
  title: "BEVMAQ · Team",
  robots: { index: false, follow: false },
};

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next: rawNext } = await searchParams;
  const next = sanitizeNextPath(Array.isArray(rawNext) ? rawNext[0] : rawNext);
  const jar = await cookies();
  const locale = pickLocale(jar.get(LANG_COOKIE)?.value, (await headers()).get("accept-language"));
  const session = verifySession(jar.get(SESSION_COOKIE)?.value);
  const t = GATE_COPY[locale];

  return (
    <GateShell locale={locale} next={next} from="team">
      <Kicker>{t.teamKicker}</Kicker>
      <h1 className={`${HEADLINE} mt-5 text-orange`}>{t.teamHeadline}</h1>
      {session && isTeamEmail(session.email) ? (
        <>
          <p className={`${LEDE} mt-7`}>{t.teamSignedIn.replace("{email}", session.email)}</p>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <a
              href={next}
              className="inline-flex items-center rounded-full border border-blue/40 bg-blue/10 px-6 py-3 font-mono text-[13px] tracking-[0.08em] text-blue-soft no-underline transition-colors hover:border-blue hover:text-text"
            >
              {t.teamContinue}
            </a>
            <form method="post" action="/api/early-access/signout?from=team" className="m-0">
              <button
                type="submit"
                className="cursor-pointer border-0 bg-transparent p-0 font-mono text-[12.5px] text-dim underline-offset-4 hover:text-muted hover:underline"
              >
                {t.signOut}
              </button>
            </form>
          </div>
        </>
      ) : (
        <>
          <p className={`${LEDE} mt-7`}>{t.teamLede}</p>
          <div className="mt-9">
            <GoogleButton
              next={next}
              locale={locale}
              text="signin_with"
              intent="team"
              errorText={t.error}
              notConfiguredText={t.notConfigured}
              nonTeam={{ text: t.teamNonTeam, linkText: t.teamNonTeamLink, href: GATE_PAGE }}
            />
          </div>
        </>
      )}
    </GateShell>
  );
}
