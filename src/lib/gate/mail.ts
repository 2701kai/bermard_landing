// Early-access mails through SparkPost EU: the sign-up code and the welcome mail. Without SPARKPOST_API_KEY each is a
// dry run that logs a line instead. Payload shape, the bare-key Authorization header and content.reply_to as
// python-sparkpost builds them (bevmaq-crm-api sends its mails through that client).
import { GATE_COPY } from "@/content/early-access";
import { isLocale, type Locale } from "./locale";
import { OFFSET } from "./registry";

export const SPARKPOST_URL = "https://api.eu.sparkpost.com/api/v1/transmissions";
// Never am.bot@bevmaq.com: that is bevmaq-crm-api's affiliate intake mailbox (apps/ambot_email and the affiliate
// parsers read it), so a reply to one of these mails would land in the lead pipeline.
export const DEFAULT_MAIL_FROM = "early-access@bevmaq.com";
export const DEFAULT_REPLY_TO = "dev@bevmaq.com";

type Env = Record<string, string | undefined>;
type Mail = { subject: string; text: string; html: string };

export type CodeMailCopy = { subject: string; line: string; validity: string };
export type WelcomeCopy = {
  subject: string;
  hello: string;
  helloBare: string;
  line1: string;
  line2: string;
  bye: string;
  sign: string;
  footer: string;
};

/** "Name <email>" or a bare address; the display name defaults to BEVMAQ. */
export function mailFrom(raw: string | undefined): { email: string; name: string } {
  const value = raw?.trim() || DEFAULT_MAIL_FROM;
  const m = value.match(/^(.*)<([^>]+)>$/);
  return m ? { name: m[1]?.trim() || "BEVMAQ", email: (m[2] ?? "").trim() } : { name: "BEVMAQ", email: value };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

async function transmit(to: string, mail: Mail, env: Env, fetchImpl: typeof fetch) {
  const content: Record<string, unknown> = {
    from: mailFrom(env.EARLY_ACCESS_MAIL_FROM),
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    reply_to: env.EARLY_ACCESS_REPLY_TO?.trim() || DEFAULT_REPLY_TO,
  };
  const res = await fetchImpl(SPARKPOST_URL, {
    method: "POST",
    headers: { Authorization: env.SPARKPOST_API_KEY ?? "", "content-type": "application/json" },
    body: JSON.stringify({ options: { transactional: true }, recipients: [{ address: { email: to } }], content }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`sparkpost ${res.status}`);
}

export function codeMail(code: string, locale: Locale, copy: CodeMailCopy): Mail {
  const line = copy.line.replace("{code}", code);
  return {
    subject: copy.subject.replace("{code}", code),
    text: `${line}\n\n${copy.validity}\n`,
    html: `<!doctype html><html lang="${locale}"><body style="margin:0;padding:32px 24px;background:#070a12;color:#edf1fa;font-family:Arial,Helvetica,sans-serif">
<p style="margin:0 0 8px;font-size:12px;letter-spacing:.18em;color:#8fb3ff">BEVMAQ · EARLY ACCESS</p>
<p style="margin:0 0 20px;font-size:18px">${escapeHtml(copy.line.replace("{code}", ""))}<strong style="font-size:32px;letter-spacing:.2em;color:#ff7a1a">${code}</strong></p>
<p style="margin:0;font-size:14px;color:#93a1c2">${escapeHtml(copy.validity)}</p>
</body></html>`,
  };
}

/** Sends the code, or logs it when no key is set. Throws when SparkPost refuses, so the caller sets no challenge. */
export async function sendCodeMail(
  to: string,
  code: string,
  locale: Locale,
  copy: CodeMailCopy,
  env: Env = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<"sent" | "dry-run"> {
  if (!env.SPARKPOST_API_KEY) {
    console.info(`[early-access] dry-run code for ${to}: ${code}`);
    return "dry-run";
  }
  await transmit(to, codeMail(code, locale, copy), env, fetchImpl);
  return "sent";
}

/** The welcome mail: `number` is the displayed one; the greeting takes the first word of the name, or none. */
export function welcomeMail(
  p: { name: string; number: number; host: string },
  locale: Locale,
  copy: WelcomeCopy,
): Mail {
  const first = p.name.trim().split(/\s+/)[0] ?? "";
  const n = String(p.number);
  const hello = first ? copy.hello.replace("{first}", first) : copy.helloBare;
  const line1 = copy.line1.replace("{n}", n);
  const footer = copy.footer.replace("{host}", p.host);
  const [line1Head = "", line1Tail = ""] = copy.line1.split("{n}");
  const P = "margin:0 0 16px;font-size:16px;line-height:1.55;color:#edf1fa";
  return {
    subject: copy.subject.replace("{n}", n),
    text: `${hello}\n\n${line1}\n\n${copy.line2}\n\n${copy.bye}\n${copy.sign}\n\n--\n${footer}\n`,
    html: `<!doctype html><html lang="${locale}"><body style="margin:0;padding:0;background:#070a12;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:560px;margin:0 auto">
<div style="background:#0d1322;border-bottom:1px solid #223052;padding:18px 24px">
<span style="font-size:20px;font-weight:900;letter-spacing:.06em;color:#edf1fa">BEVMAQ</span>
<span style="margin-left:12px;font-size:11px;letter-spacing:.18em;color:#8fb3ff">EARLY ACCESS</span>
</div>
<div style="padding:28px 24px 8px">
<p style="${P}">${escapeHtml(hello)}</p>
<p style="${P}">${escapeHtml(line1Head)}<strong style="font-size:22px;color:#ff7a1a">${n}</strong>${escapeHtml(line1Tail)}</p>
<p style="${P}">${escapeHtml(copy.line2)}</p>
<p style="${P}">${escapeHtml(copy.bye)}<br>${escapeHtml(copy.sign)}</p>
</div>
<div style="padding:16px 24px 28px;border-top:1px solid #182442;font-size:12px;line-height:1.55;color:#5f6d8f">${escapeHtml(footer)}</div>
</div>
</body></html>`,
  };
}

export function welcomeCopy(locale: Locale): WelcomeCopy {
  const t = GATE_COPY[locale];
  return {
    subject: t.welcomeSubject,
    hello: t.welcomeHello,
    helloBare: t.welcomeHelloBare,
    line1: t.welcomeLine1,
    line2: t.welcomeLine2,
    bye: t.welcomeBye,
    sign: t.welcomeSign,
    footer: t.welcomeFooter,
  };
}

export function codeCopy(locale: Locale): CodeMailCopy {
  const t = GATE_COPY[locale];
  return { subject: t.mailSubject, line: t.mailLine, validity: t.mailValidity };
}

/** First registration with a verified email only (Google, e-mail code); a phone registration gets none.
 *  `number` is the seq index. Never throws: a failed mail must not block the sign-in. */
export async function sendWelcomeMail(
  p: { email: string; name: string; number: number; host: string; locale: string },
  env: Env = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<"sent" | "dry-run" | "failed"> {
  const locale: Locale = isLocale(p.locale) ? p.locale : "en";
  const mail = welcomeMail({ name: p.name, number: p.number + OFFSET, host: p.host }, locale, welcomeCopy(locale));
  if (!env.SPARKPOST_API_KEY) {
    console.info(`[early-access] dry-run welcome mail for ${p.email}: ${mail.subject}`);
    return "dry-run";
  }
  try {
    await transmit(p.email, mail, env, fetchImpl);
    return "sent";
  } catch (e) {
    console.warn("[early-access] welcome mail failed", e instanceof Error ? e.message : "unknown");
    return "failed";
  }
}
