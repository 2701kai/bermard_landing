// The e-mail code mail, through SparkPost EU. Without SPARKPOST_API_KEY it is a dry run that logs the code.
// Payload shape and the bare-key Authorization header as python-sparkpost builds them (bevmaq-crm-api sends its
// mails through that client).
import type { Locale } from "./locale";

export const SPARKPOST_URL = "https://api.eu.sparkpost.com/api/v1/transmissions";
// am.bot@bevmaq.com: the fixed bevmaq.com sender bevmaq-crm-api already sends through SparkPost (its error mails;
// client autoresponses go out from the lead's account manager instead).
export const DEFAULT_MAIL_FROM = "am.bot@bevmaq.com";

export type CodeMailCopy = { subject: string; line: string; validity: string };

/** "Name <email>" or a bare address; the display name defaults to BEVMAQ. */
export function mailFrom(raw: string | undefined): { email: string; name: string } {
  const value = raw?.trim() || DEFAULT_MAIL_FROM;
  const m = value.match(/^(.*)<([^>]+)>$/);
  return m ? { name: m[1]?.trim() || "BEVMAQ", email: (m[2] ?? "").trim() } : { name: "BEVMAQ", email: value };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function codeMail(code: string, locale: Locale, copy: CodeMailCopy) {
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
  env: Record<string, string | undefined> = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<"sent" | "dry-run"> {
  if (!env.SPARKPOST_API_KEY) {
    console.info(`[early-access] dry-run code for ${to}: ${code}`);
    return "dry-run";
  }
  const mail = codeMail(code, locale, copy);
  const res = await fetchImpl(SPARKPOST_URL, {
    method: "POST",
    headers: { Authorization: env.SPARKPOST_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({
      options: { transactional: true },
      recipients: [{ address: { email: to } }],
      content: { from: mailFrom(env.EARLY_ACCESS_MAIL_FROM), subject: mail.subject, text: mail.text, html: mail.html },
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`sparkpost ${res.status}`);
  return "sent";
}
