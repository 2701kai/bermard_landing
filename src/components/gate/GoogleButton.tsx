"use client";

// Google Identity Services button (script via next/script, as in BEVMAQ_OS app/login/LoginClient.tsx), shared by
// the gate page and /team.
// The credential goes to /api/early-access/login; a full navigation afterwards lets the proxy see the new cookie.
import Script from "next/script";
import { useCallback, useState } from "react";

interface GsiCredentialResponse {
  credential: string;
}
interface GoogleAccountsId {
  initialize: (cfg: { client_id: string; callback: (r: GsiCredentialResponse) => void }) => void;
  renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// GIS warns when google.accounts.id.initialize() runs more than once per page, so it runs once per client id and its
// callback hands the credential to the handler of the button that mounted last (next, intent differ per page).
let initializedFor: string | null = null;
let onCredential: ((r: GsiCredentialResponse) => void) | null = null;

function initializeOnce(google: { accounts: { id: GoogleAccountsId } }, clientId: string) {
  if (initializedFor === clientId) return;
  google.accounts.id.initialize({ client_id: clientId, callback: (r) => onCredential?.(r) });
  initializedFor = clientId;
}

// renderButton's width is the minimum button width, at most 400px (GIS js-reference); following the column keeps
// the button inside it on a 320px phone.
function buttonWidth(el: HTMLElement): number {
  return Math.max(200, Math.min(400, Math.floor(el.clientWidth)));
}

export function GoogleButton({
  next,
  locale,
  text,
  intent,
  errorText,
  notConfiguredText,
  nonTeam,
}: {
  next: string;
  locale: string;
  /** signup_with: the public-mode sign-up on the gate page; signin_with: the staff sign-in on /team. */
  text: "signup_with" | "signin_with";
  /** 'team' (/team): a non-team account gets no session and sees `nonTeam`. */
  intent?: "team";
  errorText: string;
  notConfiguredText: string;
  nonTeam?: { text: string; linkText: string; href: string };
}) {
  const [gsiReady, setGsiReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"error" | "not_team" | null>(null);

  const mountButton = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el || !CLIENT_ID || !window.google) return;
      onCredential = async (r) => {
        setBusy(true);
        setError(null);
        try {
          const res = await fetch("/api/early-access/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ credential: r.credential, next, intent }),
          });
          const data = (await res.json()) as { ok?: boolean; redirect?: unknown; reason?: unknown };
          if (res.ok && data.ok && typeof data.redirect === "string") {
            window.location.assign(data.redirect);
            return;
          }
          setError(data.reason === "not_team" ? "not_team" : "error");
        } catch {
          setError("error");
        }
        setBusy(false);
      };
      initializeOnce(window.google, CLIENT_ID);
      const google = window.google;
      let width = 0;
      const render = () => {
        const w = buttonWidth(el);
        if (w === width) return;
        width = w;
        google.accounts.id.renderButton(el, {
          theme: "filled_black",
          shape: "pill",
          size: "large",
          text,
          locale,
          width: w,
        });
      };
      render();
      // A rotation changes the column width: render again at the new width.
      const observer = new ResizeObserver(render);
      observer.observe(el);
      return () => observer.disconnect();
    },
    [next, locale, text, intent],
  );

  if (!CLIENT_ID) {
    return <p className="font-mono text-[12px] tracking-[0.08em] text-dim">{notConfiguredText}</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      <Script src="https://accounts.google.com/gsi/client" onReady={() => setGsiReady(true)} />
      <div
        className={`min-h-[44px] max-w-full transition-opacity ${busy ? "pointer-events-none opacity-50" : ""}`}
        aria-busy={busy}
      >
        {gsiReady && <div ref={mountButton} className="max-w-full" />}
      </div>
      {error === "not_team" && nonTeam ? (
        <p role="alert" className="m-0 font-mono text-[12.5px] leading-[1.6] text-orange-soft">
          {nonTeam.text}{" "}
          <a href={nonTeam.href} className="text-blue-soft underline underline-offset-4 hover:text-text">
            {nonTeam.linkText}
          </a>
        </p>
      ) : (
        error && (
          <p role="alert" className="m-0 font-mono text-[12.5px] text-orange-soft">
            {errorText}
          </p>
        )
      )}
    </div>
  );
}
