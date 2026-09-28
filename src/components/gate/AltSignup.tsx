"use client";

// Public mode, under the Google button: an "or" divider and two small tabs, e-mail code and phone callback.
// Both forms carry a hidden honeypot field (website) and post JSON to /api/early-access/{email/start,email/verify,phone}.
import { useState } from "react";
import type { GateCopy } from "@/content/early-access";

type Tab = "email" | "phone" | null;
type Reason = "wrong" | "expired" | "invalid_phone" | "too_many" | "error" | null;

const RESEND_MS = 60_000;

const INPUT =
  "w-full rounded-[10px] border border-line bg-ink-1 px-4 py-3 font-body text-[16px] text-text outline-none transition-colors placeholder:text-dim focus:border-blue";
const LABEL = "font-mono text-[11px] tracking-[0.12em] text-muted uppercase";
const SUBMIT =
  "inline-flex cursor-pointer items-center justify-center rounded-full border border-blue/40 bg-blue/10 px-6 py-3 font-mono text-[13px] tracking-[0.06em] text-blue-soft transition-colors hover:border-blue hover:text-text disabled:cursor-not-allowed disabled:opacity-50";

function Honeypot() {
  return (
    <input
      type="text"
      name="website"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      className="absolute -left-[9999px] h-px w-px opacity-0"
    />
  );
}

async function post(url: string, body: object): Promise<{ ok: boolean; reason?: string; redirect?: string }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { ok?: boolean; reason?: string; redirect?: string };
    return { ok: res.ok && data.ok === true, reason: data.reason, redirect: data.redirect };
  } catch {
    return { ok: false };
  }
}

export function AltSignup({ t, next }: { t: GateCopy; next: string }) {
  const [tab, setTab] = useState<Tab>(null);
  const [step, setStep] = useState<"enter" | "code">("enter");
  const [email, setEmail] = useState("");
  const [sentAt, setSentAt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState<Reason>(null);

  const message =
    reason === "wrong"
      ? t.codeWrong
      : reason === "expired"
        ? t.codeExpired
        : reason === "invalid_phone"
          ? t.phoneInvalid
          : reason === "too_many"
            ? t.tooMany
            : reason
              ? t.error
              : null;

  async function sendCode(address: string, honeypot: string) {
    setBusy(true);
    setReason(null);
    const r = await post("/api/early-access/email/start", { email: address, website: honeypot });
    setBusy(false);
    if (!r.ok) return setReason(r.reason === "rate_limited" || r.reason === "wait" ? "too_many" : "error");
    setEmail(address);
    setSentAt(Date.now());
    setStep("code");
  }

  async function onEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await sendCode(String(f.get("email") ?? ""), String(f.get("website") ?? ""));
  }

  async function onCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setReason(null);
    const r = await post("/api/early-access/email/verify", {
      code: String(f.get("code") ?? ""),
      next,
      website: String(f.get("website") ?? ""),
    });
    if (r.ok) return window.location.assign(r.redirect ?? "/early-access");
    setBusy(false);
    setReason(r.reason === "wrong" || r.reason === "expired" ? r.reason : "error");
  }

  async function onPhone(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setReason(null);
    const r = await post("/api/early-access/phone", {
      name: String(f.get("name") ?? ""),
      phone: String(f.get("phone") ?? ""),
      website: String(f.get("website") ?? ""),
    });
    if (r.ok) return window.location.assign(r.redirect ?? "/early-access");
    setBusy(false);
    setReason(r.reason === "invalid_phone" ? "invalid_phone" : "error");
  }

  function pick(next: Tab) {
    setTab(next);
    setReason(null);
  }

  return (
    <div className="mt-7 flex w-full max-w-[400px] flex-col gap-5">
      <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.18em] text-dim uppercase">
        <span className="h-px flex-1 bg-line" />
        {t.or}
        <span className="h-px flex-1 bg-line" />
      </div>
      <fieldset className="m-0 flex gap-2 border-0 p-0">
        {(["email", "phone"] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={tab === k}
            onClick={() => pick(tab === k ? null : k)}
            className={`flex-1 cursor-pointer rounded-full border px-4 py-2 font-mono text-[12px] tracking-[0.06em] transition-colors ${
              tab === k
                ? "border-blue/40 bg-blue/10 text-blue-soft"
                : "border-line bg-transparent text-muted hover:border-blue/40 hover:text-text"
            }`}
          >
            {k === "email" ? t.tabEmail : t.tabPhone}
          </button>
        ))}
      </fieldset>

      {tab === "email" && step === "enter" && (
        <form onSubmit={onEmail} className="relative m-0 flex flex-col gap-3">
          <label className="flex flex-col gap-2">
            <span className={LABEL}>{t.emailLabel}</span>
            <input name="email" type="email" required autoComplete="email" maxLength={254} className={INPUT} />
          </label>
          <Honeypot />
          <button type="submit" disabled={busy} className={`${SUBMIT} self-start`}>
            {t.emailSend}
          </button>
        </form>
      )}

      {tab === "email" && step === "code" && (
        <form onSubmit={onCode} className="relative m-0 flex flex-col gap-3">
          <p className="m-0 text-[15px] leading-[1.55] text-text">{t.codeSent.replace("{email}", email)}</p>
          <label className="flex flex-col gap-2">
            <span className={LABEL}>{t.codeLabel}</span>
            <input
              name="code"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              className={`${INPUT} font-mono tracking-[0.4em]`}
            />
          </label>
          <Honeypot />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <button type="submit" disabled={busy} className={SUBMIT}>
              {t.codeConfirm}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => (Date.now() - sentAt >= RESEND_MS ? sendCode(email, "") : setReason(null))}
              className="cursor-pointer border-0 bg-transparent p-0 font-mono text-[12px] text-dim underline-offset-4 hover:text-muted hover:underline disabled:cursor-not-allowed"
            >
              {t.codeResend}
            </button>
          </div>
        </form>
      )}

      {tab === "phone" && (
        <form onSubmit={onPhone} className="relative m-0 flex flex-col gap-3">
          <label className="flex flex-col gap-2">
            <span className={LABEL}>{t.phoneName}</span>
            <input name="name" required autoComplete="name" maxLength={120} className={INPUT} />
          </label>
          <label className="flex flex-col gap-2">
            <span className={LABEL}>{t.phoneLabel}</span>
            <input
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              maxLength={32}
              placeholder={t.phonePlaceholder}
              className={INPUT}
            />
          </label>
          <Honeypot />
          <button type="submit" disabled={busy} className={`${SUBMIT} self-start`}>
            {t.phoneSubmit}
          </button>
          <p className="m-0 text-[13.5px] leading-[1.55] text-muted">{t.phoneHint}</p>
        </form>
      )}

      {message && (
        <p role="alert" className="m-0 font-mono text-[12.5px] leading-[1.6] text-orange-soft">
          {message}
        </p>
      )}
    </div>
  );
}
