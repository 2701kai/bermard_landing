"use client";

// Google Identity Services button (script via next/script, as in BEVMAQ_OS app/login/LoginClient.tsx).
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

export function GoogleButton({
  next,
  locale,
  text,
  errorText,
  notConfiguredText,
}: {
  next: string;
  locale: string;
  /** signup_with: the public-mode sign-up; signin_with: the closed-mode team entry. */
  text: "signup_with" | "signin_with";
  errorText: string;
  notConfiguredText: string;
}) {
  const [gsiReady, setGsiReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const mountButton = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el || !CLIENT_ID || !window.google) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (r) => {
          setBusy(true);
          setError(false);
          try {
            const res = await fetch("/api/early-access/login", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ credential: r.credential, next }),
            });
            const data = (await res.json()) as { ok?: boolean; redirect?: unknown };
            if (res.ok && data.ok && typeof data.redirect === "string") {
              window.location.assign(data.redirect);
              return;
            }
          } catch {}
          setError(true);
          setBusy(false);
        },
      });
      window.google.accounts.id.renderButton(el, {
        theme: "filled_black",
        shape: "pill",
        size: "large",
        text,
        locale,
      });
    },
    [next, locale, text],
  );

  if (!CLIENT_ID) {
    return <p className="font-mono text-[12px] tracking-[0.08em] text-dim">{notConfiguredText}</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      <Script src="https://accounts.google.com/gsi/client" onReady={() => setGsiReady(true)} />
      <div
        className={`min-h-[44px] transition-opacity ${busy ? "pointer-events-none opacity-50" : ""}`}
        aria-busy={busy}
      >
        {gsiReady && <div ref={mountButton} />}
      </div>
      {error && (
        <p role="alert" className="font-mono text-[12.5px] text-orange-soft">
          {errorText}
        </p>
      )}
    </div>
  );
}
