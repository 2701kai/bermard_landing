// E-mail code and phone callback sign-up: OTP challenge, phone normalizing, honeypot, closed-mode 404s, the flows,
// SparkPost. No network: registry, mail and fetch are fakes.
import { describe, expect, mock, test } from "bun:test";
import { isTeamEmail } from "@/lib/gate/access";
import { codeMail, DEFAULT_MAIL_FROM, mailFrom, SPARKPOST_URL, sendCodeMail } from "@/lib/gate/mail";
import {
  bumpTries,
  checkCode,
  createChallenge,
  newCode,
  normalizeEmail,
  OTP_MAX_TRIES,
  OTP_RESEND_MS,
  OTP_TTL_MS,
  readChallenge,
  resendAllowed,
} from "@/lib/gate/otp";
import { normalizePhone } from "@/lib/gate/phone";
import { telegramText } from "@/lib/gate/registry";
import { type FlowDeps, startEmail, submitPhone, verifyEmail } from "@/lib/gate/signup";

const SECRET = "s".repeat(64);
const NOW = Date.UTC(2026, 8, 28, 10);
const COPY = { subject: "Dein Code: {code}", line: "Dein Code: {code}", validity: "Er gilt 15 Minuten." };

describe("OTP challenge", () => {
  test("newCode is six digits", () => {
    for (let i = 0; i < 50; i++) expect(newCode()).toMatch(/^\d{6}$/);
  });

  test("sign, read back, right and wrong code", () => {
    const { challenge, cookie } = createChallenge("ada@example.com", "123456", NOW, SECRET);
    const c = readChallenge(cookie, SECRET);
    expect(c).toEqual(challenge);
    expect(c?.tries).toBe(0);
    expect(c?.exp).toBe(NOW + OTP_TTL_MS);
    if (!c) throw new Error("no challenge");
    expect(checkCode(c, "123456", NOW, SECRET)).toBe("ok");
    expect(checkCode(c, "654321", NOW, SECRET)).toBe("wrong");
    expect(checkCode(c, "12345", NOW, SECRET)).toBe("wrong");
    expect(c.h).not.toContain("123456");
  });

  test("a tampered or foreign-secret cookie reads as null", () => {
    const { cookie } = createChallenge("ada@example.com", "123456", NOW, SECRET);
    expect(readChallenge(cookie, "x".repeat(64))).toBeNull();
    expect(readChallenge(`${cookie.slice(0, -3)}abc`, SECRET)).toBeNull();
  });

  test("expiry after 15 minutes", () => {
    const { challenge } = createChallenge("ada@example.com", "123456", NOW, SECRET);
    expect(checkCode(challenge, "123456", NOW + OTP_TTL_MS, SECRET)).toBe("ok");
    expect(checkCode(challenge, "123456", NOW + OTP_TTL_MS + 1, SECRET)).toBe("expired");
  });

  test("five tries, then even the right code is expired", () => {
    let { cookie } = createChallenge("ada@example.com", "123456", NOW, SECRET);
    for (let i = 0; i < OTP_MAX_TRIES; i++) {
      const c = readChallenge(cookie, SECRET);
      if (!c) throw new Error("no challenge");
      expect(checkCode(c, "000000", NOW, SECRET)).toBe("wrong");
      cookie = bumpTries(c, SECRET);
    }
    const spent = readChallenge(cookie, SECRET);
    if (!spent) throw new Error("no challenge");
    expect(spent.tries).toBe(5);
    expect(checkCode(spent, "123456", NOW, SECRET)).toBe("expired");
  });

  test("a resend for the same address waits 60 s", () => {
    const { challenge } = createChallenge("ada@example.com", "123456", NOW, SECRET);
    expect(resendAllowed(challenge, "ada@example.com", NOW + OTP_RESEND_MS - 1)).toBe(false);
    expect(resendAllowed(challenge, "ada@example.com", NOW + OTP_RESEND_MS)).toBe(true);
    expect(resendAllowed(challenge, "bob@example.com", NOW + 1)).toBe(true);
    expect(resendAllowed(null, "ada@example.com", NOW)).toBe(true);
  });

  test("email normalizing", () => {
    expect(normalizeEmail("  Ada@Example.COM ")).toBe("ada@example.com");
    expect(normalizeEmail("ada@example")).toBeNull();
    expect(normalizeEmail("no at sign")).toBeNull();
    expect(normalizeEmail(`${"a".repeat(250)}@example.com`)).toBeNull();
    expect(normalizeEmail(42)).toBeNull();
  });
});

describe("phone normalizing", () => {
  test.each([
    ["+49 151 1234 5678", "+4915112345678"],
    ["0049 (0)151-1234.5678", "+49015112345678"], // the briefed rule keeps a (0) trunk digit
    ["0049 151-1234.5678", "+4915112345678"],
    ["+39 (02) 1234 5678", "+390212345678"],
    ["+44 20 7946 0958", "+442079460958"],
    ["+1234567", null],
    ["+1234567890123456", null],
    ["015112345678", null],
    ["+49 151 1234 567x", null],
    ["", null],
  ])("%p -> %p", (raw, want) => {
    expect(normalizePhone(raw)).toBe(want);
  });
  test("a phone id is never team", () => {
    expect(isTeamEmail("+4915112345678", "+4915112345678")).toBe(false);
  });
});

function fakes(first = true) {
  const register = mock(async () => ({ number: 5, first }));
  const notify = mock(async () => "dry-run" as const);
  const send = mock(async () => "dry-run" as const);
  const claimAttempt = mock(async () => true);
  const deps: FlowDeps = {
    isPublic: true,
    register: register as unknown as FlowDeps["register"],
    notify: notify as unknown as FlowDeps["notify"],
    send,
    claimAttempt,
    allow: "",
    now: NOW,
    secret: SECRET,
  };
  return { register, notify, send, claimAttempt, deps };
}

const base = { host: "coming-soon.bevmaq.com", locale: "de" as const };

describe("closed mode and honeypot", () => {
  test("closed mode: every sign-up endpoint is a 404 and touches nothing", async () => {
    const f = fakes();
    const deps = { ...f.deps, isPublic: false };
    expect(
      (await startEmail({ email: "ada@example.com", honeypot: "", locale: "de", challenge: undefined }, deps)).status,
    ).toBe(404);
    expect(
      (await verifyEmail({ ...base, code: "123456", honeypot: "", next: null, challenge: undefined }, deps)).status,
    ).toBe(404);
    expect((await submitPhone({ ...base, name: "Bo", phone: "+4915112345678", honeypot: "" }, deps)).status).toBe(404);
    expect(f.send).not.toHaveBeenCalled();
    expect(f.register).not.toHaveBeenCalled();
  });

  test("a filled honeypot is a silent 200 with no effect", async () => {
    const f = fakes();
    const start = await startEmail(
      { email: "ada@example.com", honeypot: "http://spam", locale: "de", challenge: undefined },
      f.deps,
    );
    expect(start).toEqual({ status: 200, body: { ok: true } });
    const { cookie } = createChallenge("ada@example.com", "123456", NOW, SECRET);
    const verify = await verifyEmail({ ...base, code: "123456", honeypot: "x", next: null, challenge: cookie }, f.deps);
    expect(verify).toEqual({ status: 200, body: { ok: true } });
    const phone = await submitPhone({ ...base, name: "Bo", phone: "+4915112345678", honeypot: "x" }, f.deps);
    expect(phone).toEqual({ status: 200, body: { ok: true } });
    expect(f.send).not.toHaveBeenCalled();
    expect(f.register).not.toHaveBeenCalled();
  });
});

describe("e-mail code flow", () => {
  test("start: sends the code and returns the challenge cookie; a bad address is a 400", async () => {
    const f = fakes();
    const r = await startEmail({ email: " Ada@Example.com", honeypot: "", locale: "it", challenge: undefined }, f.deps);
    expect(r.status).toBe(200);
    expect(f.send).toHaveBeenCalledTimes(1);
    const [to, code, locale] = (f.send.mock.calls[0] ?? []) as unknown as [string, string, string];
    expect([to, locale]).toEqual(["ada@example.com", "it"]);
    const c = readChallenge(r.otp, SECRET);
    if (!c) throw new Error("no challenge");
    expect(checkCode(c, code, NOW, SECRET)).toBe("ok");
    const bad = await startEmail({ email: "nope", honeypot: "", locale: "de", challenge: undefined }, f.deps);
    expect(bad).toEqual({ status: 400, body: { ok: false, reason: "invalid_email" } });
  });

  test("start: a resend within 60 s is a 429; a mail failure is a 502 without challenge", async () => {
    const f = fakes();
    const { cookie } = createChallenge("ada@example.com", "123456", NOW - 1000, SECRET);
    const again = await startEmail({ email: "ada@example.com", honeypot: "", locale: "de", challenge: cookie }, f.deps);
    expect(again.status).toBe(429);
    f.send.mockImplementation(async () => {
      throw new Error("sparkpost 500");
    });
    const failed = await startEmail(
      { email: "bob@example.com", honeypot: "", locale: "de", challenge: undefined },
      f.deps,
    );
    expect(failed.status).toBe(502);
    expect(failed.otp).toBeUndefined();
  });

  test("verify: the right code registers (source email, verified) and clears the challenge", async () => {
    const f = fakes();
    const { cookie } = createChallenge("ada@example.com", "123456", NOW, SECRET);
    const r = await verifyEmail({ ...base, code: "123 456", honeypot: "", next: "/x", challenge: cookie }, f.deps);
    expect(r).toEqual({
      status: 200,
      body: { ok: true, redirect: "/early-access" },
      session: { id: "ada@example.com", name: "", number: 5 },
      otp: null,
    });
    expect(f.register).toHaveBeenCalledWith({
      email: "ada@example.com",
      name: "",
      host: "coming-soon.bevmaq.com",
      locale: "de",
      source: "email",
      verified: true,
    });
    expect(f.notify).toHaveBeenCalledTimes(1);
  });

  test("verify: a verified @bevmaq.com address is team, signed in to next, not registered", async () => {
    const f = fakes();
    const { cookie } = createChallenge("kai@bevmaq.com", "123456", NOW, SECRET);
    const r = await verifyEmail({ ...base, code: "123456", honeypot: "", next: "/console", challenge: cookie }, f.deps);
    expect(r.session).toEqual({ id: "kai@bevmaq.com", name: "", number: null });
    expect(r.body.redirect).toBe("/console");
    expect(f.register).not.toHaveBeenCalled();
  });

  test("verify: a wrong code claims the attempt slot and bumps tries; a replayed slot spends the challenge", async () => {
    const f = fakes();
    const { cookie, challenge } = createChallenge("ada@example.com", "123456", NOW, SECRET);
    const wrong = await verifyEmail({ ...base, code: "000000", honeypot: "", next: null, challenge: cookie }, f.deps);
    expect(wrong.status).toBe(400);
    expect(wrong.body.reason).toBe("wrong");
    expect(f.claimAttempt).toHaveBeenCalledWith(challenge.cid, 0);
    expect(readChallenge(wrong.otp, SECRET)?.tries).toBe(1);
    f.claimAttempt.mockImplementation(async () => false);
    const replay = await verifyEmail({ ...base, code: "000001", honeypot: "", next: null, challenge: cookie }, f.deps);
    expect(replay).toEqual({ status: 410, body: { ok: false, reason: "expired" }, otp: null });
    expect(f.register).not.toHaveBeenCalled();
  });

  test("verify: an expired or missing challenge is 'expired'", async () => {
    const f = fakes();
    const { cookie } = createChallenge("ada@example.com", "123456", NOW - OTP_TTL_MS - 1, SECRET);
    const old = await verifyEmail({ ...base, code: "123456", honeypot: "", next: null, challenge: cookie }, f.deps);
    expect(old.body.reason).toBe("expired");
    const none = await verifyEmail({ ...base, code: "123456", honeypot: "", next: null, challenge: undefined }, f.deps);
    expect(none.body.reason).toBe("expired");
  });
});

describe("phone callback flow", () => {
  test("registers the E.164 number unverified and signs in with it", async () => {
    const f = fakes();
    const r = await submitPhone({ ...base, name: " Bo ", phone: "0049 151 1234 5678", honeypot: "" }, f.deps);
    expect(r).toEqual({
      status: 200,
      body: { ok: true, redirect: "/early-access" },
      session: { id: "+4915112345678", name: "Bo", number: 5 },
    });
    expect(f.register).toHaveBeenCalledWith({
      phone: "+4915112345678",
      name: "Bo",
      host: "coming-soon.bevmaq.com",
      locale: "de",
      source: "phone",
      verified: false,
    });
  });

  test("an invalid number or an empty name is a 400", async () => {
    const f = fakes();
    expect((await submitPhone({ ...base, name: "Bo", phone: "0151 123", honeypot: "" }, f.deps)).body).toEqual({
      ok: false,
      reason: "invalid_phone",
    });
    expect((await submitPhone({ ...base, name: " ", phone: "+4915112345678", honeypot: "" }, f.deps)).status).toBe(400);
    expect(f.register).not.toHaveBeenCalled();
  });

  test("the Telegram line marks the phone as unverified", () => {
    expect(
      telegramText({ number: 2, name: "Bo", phone: "+4915112345678", host: "demo.bevmaq.com", locale: "de" }),
    ).toBe("🆕 Early adopter Nr. 1949: Bo +4915112345678 (phone, unverified) via demo.bevmaq.com (de)");
    expect(telegramText({ number: 3, name: "", email: "ada@example.com", host: "h", locale: "en" })).toBe(
      "🆕 Early adopter Nr. 1950: ada@example.com via h (en)",
    );
  });
});

describe("SparkPost", () => {
  test("without a key it is a dry run that logs the code", async () => {
    const f = mock(async () => new Response("{}"));
    const log = mock(() => {});
    const orig = console.info;
    console.info = log;
    try {
      expect(await sendCodeMail("ada@example.com", "123456", "de", COPY, {}, f as unknown as typeof fetch)).toBe(
        "dry-run",
      );
    } finally {
      console.info = orig;
    }
    expect(f).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith("[early-access] dry-run code for ada@example.com: 123456");
  });

  test("with a key it posts the EU transmission with the bare-key header", async () => {
    const f = mock(async (_url: string, _init: RequestInit) => new Response("{}"));
    const env = { SPARKPOST_API_KEY: "k123", EARLY_ACCESS_MAIL_FROM: "BEVMAQ Early Access <hello@bevmaq.com>" };
    expect(await sendCodeMail("ada@example.com", "123456", "de", COPY, env, f as unknown as typeof fetch)).toBe("sent");
    const [url, init] = f.mock.calls[0] ?? [];
    expect(url).toBe(SPARKPOST_URL);
    expect(url).toBe("https://api.eu.sparkpost.com/api/v1/transmissions");
    expect((init?.headers as Record<string, string> | undefined)?.Authorization).toBe("k123");
    const body = JSON.parse(String(init?.body));
    expect(body.recipients).toEqual([{ address: { email: "ada@example.com" } }]);
    expect(body.options).toEqual({ transactional: true });
    expect(body.content.from).toEqual({ name: "BEVMAQ Early Access", email: "hello@bevmaq.com" });
    expect(body.content.subject).toBe("Dein Code: 123456");
    expect(body.content.text).toContain("Dein Code: 123456");
    expect(body.content.html).toContain("123456");
  });

  test("a refused transmission throws; the From defaults to am.bot@bevmaq.com", async () => {
    const notOk = (async () => new Response("no", { status: 401 })) as unknown as typeof fetch;
    await expect(sendCodeMail("a@b.co", "123456", "en", COPY, { SPARKPOST_API_KEY: "k" }, notOk)).rejects.toThrow(
      "sparkpost 401",
    );
    expect(mailFrom(undefined)).toEqual({ name: "BEVMAQ", email: DEFAULT_MAIL_FROM });
    expect(DEFAULT_MAIL_FROM).toBe("am.bot@bevmaq.com");
    expect(codeMail("123456", "it", COPY).html).toContain('lang="it"');
  });
});
