// Early-adopter registry in the shared private Vercel Blob store (the same store bevmardo_c's db/index.ts writes).
// early-access/<VERCEL_ENV|local>/people/<sha256(identifier)>.json holds one person (identifier: lowercased email or
// E.164 phone); seq/<n>.json claims number n; otp/<challenge id>/<n>.json records the n-th wrong e-mail code.
import { createHash } from "node:crypto";
import { get, list, put } from "@vercel/blob";

// Geoffrey Hinton, born 6.12.1947: the first early adopter is Nr. 1948.
export const OFFSET = 1947;
export const MAX_CLAIM_TRIES = 20;

export type Source = "google" | "email" | "phone";

export type Person = {
  email?: string;
  phone?: string;
  name: string;
  /** The seq index; the displayed number is number + OFFSET. */
  number: number;
  host: string;
  locale: string;
  source: Source;
  /** Google and the e-mail code verify the address; a callback request's phone number is unverified. */
  verified: boolean;
  first_seen: string;
  last_seen: string;
};

/** Who signs up: exactly one of email (lowercased) or phone (E.164). */
export type Registrant = {
  email?: string;
  phone?: string;
  name: string;
  host: string;
  locale: string;
  source: Source;
  verified: boolean;
};

/** The three @vercel/blob calls the registry makes; tests pass a fake. */
export type BlobApi = { list: typeof list; put: typeof put; get: typeof get };
const realBlob: BlobApi = { list, put, get };

export function storePrefix(vercelEnv: string | undefined = process.env.VERCEL_ENV): string {
  return `early-access/${vercelEnv ?? "local"}/`;
}

/** Same token handling as bevmardo_c db/index.ts: the read-write token is passed explicitly on every call. */
function envToken(): string {
  const t = process.env.BLOB_READ_WRITE_TOKEN;
  if (!t) throw new Error("Storage unavailable");
  return t;
}

/** sha256 of the identifier: the lowercased email, or the E.164 phone number as is. */
export function personKey(identifier: string): string {
  return createHash("sha256").update(identifier.trim().toLowerCase()).digest("hex");
}

async function readJson<T>(api: BlobApi, pathname: string, token: string): Promise<T | null> {
  const res = await api.get(pathname, { access: "private", useCache: false, token });
  if (!res) return null;
  if (res.statusCode !== 200) throw new Error("Storage unavailable");
  return JSON.parse(await new Response(res.stream).text()) as T;
}

async function writeJson(api: BlobApi, pathname: string, body: object, token: string, allowOverwrite: boolean) {
  await api.put(pathname, JSON.stringify(body), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite,
    contentType: "application/json",
    token,
  });
}

async function countSeq(api: BlobApi, prefix: string, token: string): Promise<number> {
  let count = 0;
  let cursor: string | undefined;
  do {
    const page = await api.list({ prefix: `${prefix}seq/`, cursor, token });
    count += page.blobs.length;
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return count;
}

/** Race-safe number claim: count seq/, then exclusive-create seq/<count+1>.json; a pathname another sign-in took
 *  first moves on to n+1. A failed create whose pathname does not exist afterwards is an outage and rethrows. */
export async function claimNumber(api: BlobApi, prefix: string, token: string, marker: object): Promise<number> {
  const start = (await countSeq(api, prefix, token)) + 1;
  for (let n = start; n < start + MAX_CLAIM_TRIES; n++) {
    const pathname = `${prefix}seq/${n}.json`;
    try {
      await writeJson(api, pathname, marker, token, false);
      return n;
    } catch (e) {
      if ((await readJson(api, pathname, token)) === null) throw e;
    }
  }
  throw new Error("Could not claim an early-adopter number");
}

/** Registers a person once. A returning person keeps the number and gets last_seen (and name, verified) updated. */
export async function registerPerson(
  who: Registrant,
  deps: { api?: BlobApi; token?: string; prefix?: string; now?: () => Date } = {},
): Promise<{ number: number; first: boolean }> {
  const api = deps.api ?? realBlob;
  const token = deps.token ?? envToken();
  const prefix = deps.prefix ?? storePrefix();
  const now = (deps.now ?? (() => new Date()))().toISOString();
  const email = who.email?.trim().toLowerCase();
  const identifier = email ?? who.phone;
  if (!identifier) throw new Error("Registrant without email or phone");
  const key = personKey(identifier);
  const personPath = `${prefix}people/${key}.json`;

  const existing = await readJson<Person>(api, personPath, token);
  if (existing) {
    const update = { ...existing, name: who.name || existing.name, verified: existing.verified || who.verified };
    await writeJson(api, personPath, { ...update, last_seen: now }, token, true);
    return { number: existing.number, first: false };
  }

  const number = await claimNumber(api, prefix, token, { key, at: now });
  const person: Person = {
    ...(email ? { email } : { phone: who.phone }),
    name: who.name,
    number,
    host: who.host,
    locale: who.locale,
    source: who.source,
    verified: who.verified,
    first_seen: now,
    last_seen: now,
  };
  try {
    await writeJson(api, personPath, person, token, false);
  } catch (e) {
    // A concurrent first sign-in of the same person won the record: theirs holds the number.
    const winner = await readJson<Person>(api, personPath, token);
    if (!winner) throw e;
    return { number: winner.number, first: false };
  }
  return { number, first: true };
}

async function listPathnames(api: BlobApi, prefix: string, token: string): Promise<string[]> {
  const out: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await api.list({ prefix, cursor, token });
    out.push(...page.blobs.map((b) => b.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

/** How many people are registered under the current prefix (a list, no reads). */
export async function countPeople(deps: { api?: BlobApi; token?: string; prefix?: string } = {}): Promise<number> {
  const prefix = deps.prefix ?? storePrefix();
  return (await listPathnames(deps.api ?? realBlob, `${prefix}people/`, deps.token ?? envToken())).length;
}

/** Every person record under the current prefix, read eight at a time. Records written before a field existed
 *  (source, verified) come back without it. */
export async function listPeople(deps: { api?: BlobApi; token?: string; prefix?: string } = {}): Promise<Person[]> {
  const api = deps.api ?? realBlob;
  const token = deps.token ?? envToken();
  const paths = await listPathnames(api, `${deps.prefix ?? storePrefix()}people/`, token);
  const people: Person[] = [];
  for (let i = 0; i < paths.length; i += 8) {
    const batch = await Promise.all(paths.slice(i, i + 8).map((p) => readJson<Person>(api, p, token)));
    for (const person of batch) if (person) people.push(person);
  }
  return people;
}

/** Each wrong e-mail code claims otp/<cid>/<n>.json exclusively, n being the tries count its cookie carried. A replayed
 *  challenge cookie (an old tries count) hits a slot that is already taken: false, and the challenge counts as spent. */
export async function claimOtpAttempt(
  cid: string,
  n: number,
  deps: { api?: BlobApi; token?: string; prefix?: string } = {},
): Promise<boolean> {
  const api = deps.api ?? realBlob;
  const token = deps.token ?? envToken();
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(cid) || !Number.isInteger(n) || n < 0) return false;
  const pathname = `${deps.prefix ?? storePrefix()}otp/${cid}/${n}.json`;
  try {
    await writeJson(api, pathname, { at: new Date().toISOString() }, token, false);
    return true;
  } catch (e) {
    if ((await readJson(api, pathname, token)) === null) throw e;
    return false;
  }
}

export type Ping = { number: number; name: string; email?: string; phone?: string; host: string; locale: string };

export function telegramText(p: Ping) {
  const who = p.phone ? `${p.name} ${p.phone} (phone, unverified)` : [p.name, p.email].filter(Boolean).join(" ");
  return `🆕 Early adopter Nr. ${p.number + OFFSET}: ${who} via ${p.host} (${p.locale})`;
}

/** First registration ping. Production only; elsewhere a dry-run log line without name or email.
 *  Never throws: a failed ping must not block the sign-in. */
export async function notifyTelegram(
  p: Ping,
  env: Record<string, string | undefined> = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<"sent" | "dry-run" | "failed"> {
  if (env.VERCEL_ENV !== "production") {
    console.info(
      `[early-access] telegram dry-run (VERCEL_ENV=${env.VERCEL_ENV ?? "unset"}): Nr. ${p.number + OFFSET} via ${p.host} (${p.locale})`,
    );
    return "dry-run";
  }
  try {
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID)
      throw new Error("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID unset");
    const res = await fetchImpl(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: telegramText(p) }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`telegram ${res.status}`);
    return "sent";
  } catch (e) {
    console.warn("[early-access] telegram ping failed", e instanceof Error ? e.message : "unknown");
    return "failed";
  }
}
