// Welcome mail on a first registration with a verified email, and the team CSV export. No network: registry,
// mail and fetch are fakes.
import { describe, expect, mock, test } from "bun:test";
import { CSV_COLUMNS, exportPeople, peopleCsv } from "@/lib/gate/export";
import { type LoginDeps, login } from "@/lib/gate/login";
import { SPARKPOST_URL, sendWelcomeMail, welcomeCopy, welcomeMail } from "@/lib/gate/mail";
import { createChallenge } from "@/lib/gate/otp";
import { signSession } from "@/lib/gate/session";
import { type FlowDeps, submitPhone, verifyEmail } from "@/lib/gate/signup";

const SECRET = "w".repeat(64);
process.env.GATE_SESSION_SECRET = SECRET;
const NOW = Date.UTC(2026, 8, 28, 10);

function fakes(first: boolean) {
  const register = mock(async () => ({ number: 1, first }));
  const notify = mock(async () => "dry-run" as const);
  const welcome = mock(async () => "dry-run" as const);
  return { register, notify, welcome };
}

describe("welcome mail triggers", () => {
  const base = { host: "coming-soon.bevmaq.com", locale: "de" as const };

  test("Google: fires on the first registration, not on a returning visit", async () => {
    const input = { credential: "c", next: null, ...base };
    const verify = async () => ({ email: "ada@gmail.com", email_verified: true, hd: null, name: "Ada Lovelace" });
    for (const first of [true, false]) {
      const f = fakes(first);
      const deps = { ...f, verify, isPublic: true, allow: "" } as unknown as LoginDeps;
      expect((await login(input, deps)).status).toBe(200);
      expect(f.welcome).toHaveBeenCalledTimes(first ? 1 : 0);
    }
  });

  test("e-mail code: fires once with the registration's email, name and locale", async () => {
    const f = fakes(true);
    const deps = { ...f, isPublic: true, allow: "", now: NOW, secret: SECRET } as unknown as FlowDeps;
    const { cookie } = createChallenge("bob@example.com", "123456", NOW, SECRET);
    await verifyEmail({ ...base, code: "123456", honeypot: "", next: null, challenge: cookie }, deps);
    expect(f.welcome).toHaveBeenCalledTimes(1);
    expect(f.welcome).toHaveBeenCalledWith({
      email: "bob@example.com",
      name: "",
      host: "coming-soon.bevmaq.com",
      locale: "de",
      source: "email",
      verified: true,
      number: 1,
    });
  });

  test("phone: never", async () => {
    const f = fakes(true);
    const deps = { ...f, isPublic: true } as unknown as FlowDeps;
    expect((await submitPhone({ ...base, name: "Bo", phone: "+4915112345678", honeypot: "" }, deps)).status).toBe(200);
    expect(f.notify).toHaveBeenCalledTimes(1);
    expect(f.welcome).not.toHaveBeenCalled();
  });
});

describe("welcome mail", () => {
  const p = { email: "ada@gmail.com", name: "Ada Lovelace", number: 1, host: "coming-soon.bevmaq.com", locale: "de" };

  test("copy: first word of the name, displayed number, host in the footer; no name, no greeting name", () => {
    const m = welcomeMail({ name: "Ada Lovelace", number: 1948, host: "demo.bevmaq.com" }, "de", welcomeCopy("de"));
    expect(m.subject).toBe("Du bist dabei: BEVMAQ Early Adopter Nr. 1948");
    expect(m.text).toContain("Hallo Ada,\n\nschön, dass du dabei bist. Deine Early-Adopter-Nummer: 1948.");
    expect(m.text).toContain("Bis bald\nDein BEVMAQ-Team");
    expect(m.text).toContain("registriert hast. Datenschutz: https://www.bevmaq.com/de/privacy/");
    expect(m.text).toContain("auf demo.bevmaq.com als");
    expect(m.html).toContain('color:#ff7a1a">1948</strong>');
    expect(welcomeMail({ name: "", number: 1948, host: "h" }, "en", welcomeCopy("en")).text.startsWith("Hi,\n")).toBe(
      true,
    );
    expect(welcomeMail({ name: "Chiara", number: 1950, host: "h" }, "it", welcomeCopy("it")).subject).toBe(
      "Ci sei: BEVMAQ early adopter n. 1950",
    );
  });

  test("without a key it is a dry run", async () => {
    const f = mock(async () => new Response("{}"));
    expect(await sendWelcomeMail(p, {}, f as unknown as typeof fetch)).toBe("dry-run");
    expect(f).not.toHaveBeenCalled();
  });

  test("with a key: EU transmission in the registration's locale; Reply-To only when set", async () => {
    const f = mock(async (_url: string, _init: RequestInit) => new Response("{}"));
    const env = { SPARKPOST_API_KEY: "k", EARLY_ACCESS_REPLY_TO: "sell@bevmaq.com" };
    expect(await sendWelcomeMail(p, env, f as unknown as typeof fetch)).toBe("sent");
    const [url, init] = f.mock.calls[0] ?? [];
    expect(url).toBe(SPARKPOST_URL);
    expect((init?.headers as Record<string, string> | undefined)?.Authorization).toBe("k");
    const body = JSON.parse(String(init?.body));
    expect(body.recipients).toEqual([{ address: { email: "ada@gmail.com" } }]);
    expect(body.content.subject).toBe("Du bist dabei: BEVMAQ Early Adopter Nr. 1948");
    expect(body.content.reply_to).toBe("sell@bevmaq.com");
    expect(body.content.from).toEqual({ name: "BEVMAQ", email: "am.bot@bevmaq.com" });
    await sendWelcomeMail(p, { SPARKPOST_API_KEY: "k" }, f as unknown as typeof fetch);
    expect(JSON.parse(String(f.mock.calls[1]?.[1]?.body)).content.reply_to).toBeUndefined();
  });

  test("a failed transmission never throws", async () => {
    const boom = (async () => {
      throw new Error("down");
    }) as unknown as typeof fetch;
    expect(await sendWelcomeMail(p, { SPARKPOST_API_KEY: "k" }, boom)).toBe("failed");
  });
});

describe("team export", () => {
  const people = [
    {
      number: 2,
      name: "Bo",
      phone: "+4915112345678",
      source: "phone" as const,
      verified: false,
      locale: "de",
      host: "demo.bevmaq.com",
      first_seen: "2026-09-28T10:00:00.000Z",
      last_seen: "2026-09-28T10:00:00.000Z",
    },
    {
      number: 1,
      name: 'Jürgen "JJ", Müller',
      email: "j@example.com",
      source: "google" as const,
      verified: true,
      locale: "de",
      host: "coming-soon.bevmaq.com",
      first_seen: "2026-09-28T09:00:00.000Z",
      last_seen: "2026-09-28T09:30:00.000Z",
    },
    { number: 3, name: "=HYPERLINK(1)", email: "x@example.com" },
  ];
  const list = async () => people;

  test("401 without a session, 403 for an early adopter or a phone session", async () => {
    expect((await exportPeople(undefined, { list })).status).toBe(401);
    const wait = signSession({ id: "ada@example.com", name: "Ada", number: 1 });
    expect((await exportPeople(wait, { list, allow: "" })).status).toBe(403);
    const phone = signSession({ id: "+4915112345678", name: "Bo", number: 2 });
    expect((await exportPeople(phone, { list, allow: "" })).status).toBe(403);
  });

  test("200 for team: BOM, header, rows sorted by displayed number, quoting and formula guard", async () => {
    const team = signSession({ id: "kai@bevmaq.com", name: "Kai", number: null });
    const r = await exportPeople(team, { list, allow: "", now: new Date(NOW), vercelEnv: "production" });
    if (r.status !== 200) throw new Error(`status ${r.status}`);
    expect(r.filename).toBe("early-access-production-2026-09-28.csv");
    expect(r.csv.startsWith("﻿")).toBe(true);
    const lines = r.csv.slice(1).trimEnd().split("\r\n");
    expect(lines[0]).toBe(CSV_COLUMNS.join(","));
    expect(lines[0]).toBe("number,name,email,phone,source,verified,locale,host,first_seen,last_seen");
    expect(lines[1]).toBe(
      '1948,"Jürgen ""JJ"", Müller",j@example.com,,google,true,de,coming-soon.bevmaq.com,2026-09-28T09:00:00.000Z,2026-09-28T09:30:00.000Z',
    );
    expect(lines[2]).toBe(
      "1949,Bo,,'+4915112345678,phone,false,de,demo.bevmaq.com,2026-09-28T10:00:00.000Z,2026-09-28T10:00:00.000Z",
    );
    expect(lines[3]).toBe("1950,'=HYPERLINK(1),x@example.com,,,,,,,");
  });

  test("an empty registry is the header only", () => {
    expect(peopleCsv([])).toBe(`﻿${CSV_COLUMNS.join(",")}\r\n`);
  });
});
