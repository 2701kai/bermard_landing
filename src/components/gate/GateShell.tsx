// The frame shared by the gate page (/early-access) and the staff sign-in (/team): wordmark, status line with the
// blinking dot, DE/EN/IT switcher, a centred content column and an optional footer line.
import type { ReactNode } from "react";
import { LOCALES, type Locale } from "@/lib/gate/locale";
import s from "./gate.module.css";

const STATUS = "PRIVATE PREVIEW · CIBUS TEC 2026";

// Capped at (100vw - 2rem) / 6.6 on phones: the widest headline word, "Congratulations.", sets 6.44 em wide, so at
// 52px it ran past a 320px viewport. From 375px up the cap does not bind and the clamp is unchanged.
export const HEADLINE =
  "m-0 font-display text-[length:min(clamp(52px,11vw,112px),calc((100vw_-_2rem)/6.6))] leading-[0.92] font-extrabold tracking-[0.005em] text-balance";
export const LEDE = "m-0 text-[18px] leading-[1.55] text-text sm:text-[20px]";

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 font-mono text-[11.5px] leading-snug font-medium tracking-[0.18em] text-blue-soft uppercase">
      {children}
    </p>
  );
}

export function GateShell({
  locale,
  next,
  from,
  footer,
  children,
}: {
  locale: Locale;
  next: string;
  /** 'team' sends the language switcher back to /team instead of the gate page. */
  from?: "team";
  footer?: ReactNode;
  children: ReactNode;
}) {
  const extra = `${next === "/" ? "" : `&next=${encodeURIComponent(next)}`}${from ? `&from=${from}` : ""}`;
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
            // The link is the 44px tap target (the negative margin keeps the header height); the pill is the span.
            <a
              key={l}
              href={`/api/early-access/lang?l=${l}${extra}`}
              hrefLang={l}
              aria-current={l === locale ? "true" : undefined}
              className="group -my-1.5 inline-flex min-h-11 items-center rounded-full no-underline"
            >
              <span
                className={`rounded-full px-2.5 py-1.5 transition-colors ${
                  l === locale
                    ? "border border-blue/40 bg-blue/10 text-blue-soft"
                    : "border border-transparent text-dim group-hover:text-text"
                }`}
              >
                {l.toUpperCase()}
              </span>
            </a>
          ))}
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col justify-center px-4 py-14 sm:px-8 sm:py-20">
        <div className="flex max-w-[680px] flex-col">{children}</div>
      </main>

      {footer && <footer className="mx-auto w-full max-w-[1080px] px-4 pb-8 sm:px-8 sm:pb-10">{footer}</footer>}
    </div>
  );
}
