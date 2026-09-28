// Early-access gate lib: session cookie, next-path guard, team decision, locale pick, number claim, Telegram gate.
// No network: the Blob API and fetch are fakes.
import { describe, expect, mock, test } from "bun:test";
import { gateOn, isTeamEmail, loginDecision, publicMode } from "@/lib/gate/access";
import { pickLocale } from "@/lib/gate/locale";
import { type LoginDeps, login } from "@/lib/gate/login";
import { type BlobApi, claimNumber, notifyTelegram, OFFSET, registerPerson, telegramText } from "@/lib/gate/registry";
import { sanitizeNextPath, signSession, verifySession } from "@/lib/gate/session";

const SECRET = "a".repeat(64);
const NOW = Date.UTC(2026, 8, 28);
const DAY = 86_400_000;

describe("session cookie", () => {
  const data = { id: "ada@example.com", name: "Ada", number: 1 };

  test("sign then verify round-trips the payload with a 30-day expiry", () => {
    const s = verifySession(signSession(data, NOW, SECRET), NOW, SECRET);
    expect(s).toEqual({ ...data, exp: NOW + 30 * DAY });
  });

  test("a team session carries number null", () => {
    expect(verifySession(signSession({ ...data, number: null }, NOW, SECRET), NOW, SECRET)?.number).toBeNull();
  });

  test("a tampered payload or signature fails", () => {
    const cookie = signSession(data, NOW, SECRET);
    const [payload = "", sig = ""] = cookie.split(".");
    const forged = Buffer.from(JSON.stringify({ ...data, id: "boss@bevmaq.com", exp: NOW + DAY })).toString(
      "base64url",
    );
    expect(verifySession(`${forged}.${sig}`, NOW, SECRET)).toBeNull();
    expect(verifySession(`${payload}.${sig.slice(0, -2)}xx`, NOW, SECRET)).toBeNull();
    expect(verifySession(cookie, NOW, "b".repeat(64))).toBeNull();
    expect(verifySession("garbage", NOW, SECRET)).toBeNull();
  });

  test("an expired session fails", () => {
    const cookie = signSession(data, NOW, SECRET);
    expect(verifySession(cookie, NOW + 30 * DAY - 1, SECRET)).not.toBeNull();
    expect(verifySession(cookie, NOW + 30 * DAY + 1, SECRET)).toBeNull();
  });

  test("no secret: signing throws, verifying lets nobody in", () => {
    expect(() => signSession(data, NOW, null)).toThrow();
    expect(verifySession(signSession(data, NOW, SECRET), NOW, null)).toBeNull();
  });
});

describe("sanitizeNextPath", () => {
  test("keeps a relative path with its query", () => {
    expect(sanitizeNextPath("/console?x=1")).toBe("/console?x=1");
    expect(sanitizeNextPath("%2Fconsole")).toBe("/console");
  });
  test.each([
    [null],
    [""],
    ["//evil.com"],
    ["%2F%2Fevil.com"],
    ["https://evil.com"],
    ["/redirect?to=https://evil.com"],
    ["/\\evil.com"],
    ["/%5Cevil.com"],
    ["/a%0Ab"],
    ["evil.com"],
    ["%E0%A4%A"],
    ["/early-access"],
    ["/early-access?next=/x"],
    ["/team"],
    ["/team?next=/x"],
  ])("%p falls back to /", (raw) => {
    expect(sanitizeNextPath(raw)).toBe("/");
  });
});

describe("team decision", () => {
  const claims = (email: string, extra: Partial<{ email_verified: boolean; hd: string | null }> = {}) => ({
    email,
    email_verified: true,
    hd: null,
    name: "X",
    ...extra,
  });

  test("verified @bevmaq.com is team, with or without hd", () => {
    expect(loginDecision(claims("kai@bevmaq.com", { hd: "bevmaq.com" }), "")).toBe("team");
    expect(loginDecision(claims("kai@bevmaq.com"), "")).toBe("team");
  });
  test("@bevmaq.com with a different hd is refused", () => {
    expect(loginDecision(claims("kai@bevmaq.com", { hd: "other.com" }), "")).toBe("reject");
  });
  test("an unverified email is refused, even on the allow list", () => {
    expect(loginDecision(claims("kai@bevmaq.com", { email_verified: false }), "")).toBe("reject");
    expect(loginDecision(claims("ada@gmail.com", { email_verified: false }), "ada@gmail.com")).toBe("reject");
  });
  test("GATE_ALLOW is comma-separated and case-insensitive", () => {
    const allow = " Ada@Gmail.com , bob@example.org ";
    expect(loginDecision(claims("ada@gmail.com"), allow)).toBe("team");
    expect(isTeamEmail("ADA@gmail.com", allow)).toBe(true);
    expect(isTeamEmail("bob@example.org", allow)).toBe(true);
    expect(isTeamEmail("eve@example.org", allow)).toBe(false);
  });
  test("everyone else is an early adopter", () => {
    expect(loginDecision(claims("eve@example.org"), "")).toBe("waitlist");
    expect(isTeamEmail("eve@bevmaq.com.evil.org", "")).toBe(false);
  });
  test("GATE=off is the only way to open the gate", () => {
    expect(gateOn("off")).toBe(false);
    expect(gateOn(undefined)).toBe(true);
    expect(gateOn("on")).toBe(true);
    expect(gateOn("OFF")).toBe(true);
  });
});

describe("locale pick", () => {
  test("the lang cookie wins", () => {
    expect(pickLocale("it", "de-DE,de;q=0.9")).toBe("it");
  });
  test("an unknown cookie falls through to Accept-Language", () => {
    expect(pickLocale("fr", "de-DE,de;q=0.9,en;q=0.8")).toBe("de");
  });
  test("Accept-Language is ranked by q", () => {
    expect(pickLocale(null, "fr-FR,fr;q=0.9,it;q=0.8,de;q=0.5")).toBe("it");
    expect(pickLocale(null, "en;q=0.2, de;q=0.9")).toBe("de");
    expect(pickLocale(null, "de;q=0, it")).toBe("it");
  });
  test("nothing usable is en", () => {
    expect(pickLocale(undefined, "fr-FR,es;q=0.9")).toBe("en");
    expect(pickLocale(undefined, null)).toBe("en");
  });
});

function fakeBlob(pageSize = 2) {
  const store = new Map<string, string>();
  const puts: { pathname: string; opts: Record<string, unknown> }[] = [];
  let beforePut: (pathname: string) => void = () => {};
  const api = {
    list: async ({ prefix = "", cursor }: { prefix?: string; cursor?: string }) => {
      const keys = [...store.keys()].filter((k) => k.startsWith(prefix)).sort();
      const start = cursor ? Number(cursor) : 0;
      const blobs = keys.slice(start, start + pageSize).map((pathname) => ({ pathname }));
      const hasMore = start + pageSize < keys.length;
      return { blobs, hasMore, cursor: hasMore ? String(start + pageSize) : undefined };
    },
    put: async (pathname: string, body: string, opts: Record<string, unknown>) => {
      puts.push({ pathname, opts });
      beforePut(pathname);
      if (store.has(pathname) && !opts.allowOverwrite) throw new Error("This blob already exists");
      store.set(pathname, body);
      return { pathname };
    },
    get: async (pathname: string) =>
      store.has(pathname) ? { statusCode: 200, stream: new Response(store.get(pathname)).body } : null,
  };
  return {
    api: api as unknown as BlobApi,
    store,
    puts,
    onBeforePut: (fn: (pathname: string) => void) => {
      beforePut = fn;
    },
  };
}

describe("number claim", () => {
  const P = "early-access/local/";

  test("claims count+1 with an exclusive, suffix-free, private put (count paginates)", async () => {
    const b = fakeBlob();
    for (const n of [1, 2, 3]) b.store.set(`${P}seq/${n}.json`, "{}");
    expect(await claimNumber(b.api, P, "t", {})).toBe(4);
    expect(b.puts[0]).toEqual({
      pathname: `${P}seq/4.json`,
      opts: {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: false,
        contentType: "application/json",
        token: "t",
      },
    });
  });

  test("a conflict on n moves on to n+1", async () => {
    const b = fakeBlob();
    b.store.set(`${P}seq/1.json`, "{}");
    b.onBeforePut((p) => {
      if (p === `${P}seq/2.json` && !b.store.has(p)) b.store.set(p, "{}"); // another sign-in took 2 first
    });
    expect(await claimNumber(b.api, P, "t", {})).toBe(3);
    expect(b.puts.map((x) => x.pathname)).toEqual([`${P}seq/2.json`, `${P}seq/3.json`]);
  });

  test("a failed put that did not create the blob is an outage and rethrows", async () => {
    const b = fakeBlob();
    b.onBeforePut(() => {
      throw new Error("service unavailable");
    });
    await expect(claimNumber(b.api, P, "t", {})).rejects.toThrow("service unavailable");
  });

  test("registration is once per person; a returning person keeps the number", async () => {
    const b = fakeBlob();
    let t = NOW;
    const deps = { api: b.api, token: "t", prefix: P, now: () => new Date(t) };
    const who = {
      email: "Ada@Example.com",
      name: "Ada",
      host: "coming-soon.bevmaq.com",
      locale: "de",
      source: "google" as const,
      verified: true,
    };
    expect(await registerPerson(who, deps)).toEqual({ number: 1, first: true });
    t += DAY;
    expect(await registerPerson({ ...who, email: "ada@example.com" }, deps)).toEqual({ number: 1, first: false });
    expect(await registerPerson({ ...who, email: "bob@example.com" }, deps)).toEqual({ number: 2, first: true });
    const people = [...b.store.keys()].filter((k) => k.includes("/people/"));
    expect(people).toHaveLength(2);
    const ada = [...b.store.values()].map((v) => JSON.parse(v)).find((v) => v.email === "ada@example.com");
    expect(ada).toMatchObject({ number: 1, locale: "de", host: "coming-soon.bevmaq.com" });
    expect(ada.first_seen).toBe(new Date(NOW).toISOString());
    expect(ada.last_seen).toBe(new Date(NOW + DAY).toISOString());
    expect(ada).toMatchObject({ source: "google", verified: true });
    const phone = {
      phone: "+4915112345678",
      name: "Bo",
      host: "h",
      locale: "de",
      source: "phone" as const,
      verified: false,
    };
    expect(await registerPerson(phone, deps)).toEqual({ number: 3, first: true });
    const bo = [...b.store.values()].map((v) => JSON.parse(v)).find((v) => v.phone === "+4915112345678");
    expect(bo).toMatchObject({ name: "Bo", source: "phone", verified: false });
    expect(bo.email).toBeUndefined();
  });
});

describe("Telegram ping", () => {
  const p = { number: 1, name: "Ada", email: "ada@example.com", host: "demo.bevmaq.com", locale: "it" };

  test("the displayed number is n + 1947: the first early adopter is Nr. 1948", () => {
    expect(OFFSET).toBe(1947);
    expect(telegramText(p)).toBe("🆕 Early adopter Nr. 1948: Ada ada@example.com via demo.bevmaq.com (it)");
  });

  test("outside production it is a dry run and never calls fetch", async () => {
    const f = mock(async () => new Response("{}"));
    const f2 = f as unknown as typeof fetch;
    expect(await notifyTelegram(p, { VERCEL_ENV: "preview", TELEGRAM_BOT_TOKEN: "x", TELEGRAM_CHAT_ID: "1" }, f2)).toBe(
      "dry-run",
    );
    expect(await notifyTelegram(p, {}, f2)).toBe("dry-run");
    expect(f).not.toHaveBeenCalled();
  });

  test("in production it posts sendMessage", async () => {
    const f = mock(async (_url: string, _init: RequestInit) => new Response("{}"));
    const env = { VERCEL_ENV: "production", TELEGRAM_BOT_TOKEN: "123:abc", TELEGRAM_CHAT_ID: "-42" };
    expect(await notifyTelegram(p, env, f as unknown as typeof fetch)).toBe("sent");
    const [url, init] = f.mock.calls[0] ?? [];
    expect(url).toBe("https://api.telegram.org/bot123:abc/sendMessage");
    expect(JSON.parse(String(init?.body))).toEqual({ chat_id: "-42", text: telegramText(p) });
  });

  test("a failing ping never throws", async () => {
    const env = { VERCEL_ENV: "production", TELEGRAM_BOT_TOKEN: "123:abc", TELEGRAM_CHAT_ID: "-42" };
    const boom = (async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;
    expect(await notifyTelegram(p, env, boom)).toBe("failed");
    const notOk = (async () => new Response("nope", { status: 500 })) as unknown as typeof fetch;
    expect(await notifyTelegram(p, env, notOk)).toBe("failed");
    expect(await notifyTelegram(p, { VERCEL_ENV: "production" }, notOk)).toBe("failed");
  });
});

describe("login modes", () => {
  const input = { credential: "cred", next: "/console?x=1", host: "coming-soon.bevmaq.com", locale: "de" as const };
  const claims = (email: string) => async () => ({ email, email_verified: true, hd: null, name: "N" });
  const spies = () => {
    const register = mock(async () => ({ number: 7, first: true }));
    const notify = mock(async () => "dry-run" as const);
    return {
      register,
      notify,
      deps: {
        register: register as unknown as LoginDeps["register"],
        notify: notify as unknown as LoginDeps["notify"],
        allow: "",
      },
    };
  };

  test("GATE_PUBLIC=on is the only way into public mode", () => {
    expect(publicMode("on")).toBe(true);
    expect(publicMode(undefined)).toBe(false);
    expect(publicMode("true")).toBe(false);
    expect(publicMode("ON")).toBe(false);
  });

  test("closed mode: a verified non-team account gets no registration, no number, no session", async () => {
    const s = spies();
    const r = await login(input, { ...s.deps, verify: claims("ada@gmail.com"), isPublic: false });
    expect(r).toEqual({ status: 403 });
    expect(r.session).toBeUndefined();
    expect(s.register).not.toHaveBeenCalled();
    expect(s.notify).not.toHaveBeenCalled();
  });

  test("team Google login: no deep link lands on /team, a deep link wins", async () => {
    const s = spies();
    const deps = { ...s.deps, verify: claims("kai@bevmaq.com") };
    for (const next of [null, "/", "//evil.com"])
      expect((await login({ ...input, next }, deps)).redirect).toBe("/team");
    expect((await login({ ...input, next: "/s/abc" }, deps)).redirect).toBe("/s/abc");
  });

  test("closed mode: team signs in to `next` without a number", async () => {
    const s = spies();
    const r = await login(input, { ...s.deps, verify: claims("kai@bevmaq.com"), isPublic: false });
    expect(r).toEqual({
      status: 200,
      redirect: "/console?x=1",
      session: { id: "kai@bevmaq.com", name: "N", number: null },
    });
    expect(s.register).not.toHaveBeenCalled();
  });

  test("public mode: a non-team account is registered, pinged once and lands on the waitlist view", async () => {
    const s = spies();
    const r = await login(input, { ...s.deps, verify: claims("ada@gmail.com"), isPublic: true });
    expect(r).toEqual({
      status: 200,
      redirect: "/early-access",
      session: { id: "ada@gmail.com", name: "N", number: 7 },
    });
    expect(s.register).toHaveBeenCalledWith({
      email: "ada@gmail.com",
      name: "N",
      host: "coming-soon.bevmaq.com",
      locale: "de",
      source: "google",
      verified: true,
    });
    expect(s.notify).toHaveBeenCalledTimes(1);
  });

  test("public mode: a returning early adopter is not pinged again; a storage failure is a 503 without session", async () => {
    const s = spies();
    s.register.mockImplementation(async () => ({ number: 7, first: false }));
    expect((await login(input, { ...s.deps, verify: claims("ada@gmail.com"), isPublic: true })).status).toBe(200);
    expect(s.notify).not.toHaveBeenCalled();
    s.register.mockImplementation(async () => {
      throw new Error("Storage unavailable");
    });
    expect(await login(input, { ...s.deps, verify: claims("ada@gmail.com"), isPublic: true })).toEqual({ status: 503 });
  });

  test("staff sign-in (intent team): a non-team account gets no registration and no session, in both modes", async () => {
    for (const isPublic of [false, true]) {
      const s = spies();
      const r = await login({ ...input, intent: "team" }, { ...s.deps, verify: claims("ada@gmail.com"), isPublic });
      expect(r).toEqual({ status: 403, reason: "not_team" });
      expect(r.session).toBeUndefined();
      expect(s.register).not.toHaveBeenCalled();
    }
  });

  test("staff sign-in (intent team): a team account gets a session and stays on /team, next kept for Continue", async () => {
    const s = spies();
    const ok = await login(
      { ...input, intent: "team" },
      { ...s.deps, verify: claims("kai@bevmaq.com"), isPublic: true },
    );
    expect(ok).toEqual({
      status: 200,
      redirect: "/team?next=%2Fconsole%3Fx%3D1",
      session: { id: "kai@bevmaq.com", name: "N", number: null },
    });
    for (const next of ["//evil.com", "/team", null]) {
      const r = await login({ ...input, next, intent: "team" }, { ...s.deps, verify: claims("kai@bevmaq.com") });
      expect(r.redirect).toBe("/team");
    }
    const allowed = await login(
      { ...input, intent: "team" },
      { ...s.deps, allow: "ada@gmail.com", verify: claims("ada@gmail.com"), isPublic: false },
    );
    expect(allowed.session?.id).toBe("ada@gmail.com");
    expect(s.register).not.toHaveBeenCalled();
  });

  test("an invalid credential is a 401", async () => {
    const r = await login(input, {
      verify: async () => {
        throw new Error("bad token");
      },
    });
    expect(r).toEqual({ status: 401 });
  });
});

describe("proxy: team session on the gate page", () => {
  test("no next -> 307 to /team; next=/x -> 307 to /x", async () => {
    process.env.GATE_SESSION_SECRET = SECRET;
    const { NextRequest } = await import("next/server");
    const { proxy } = await import("@/proxy");
    const cookie = `bmea_landing=${signSession({ id: "kai@bevmaq.com", name: "Kai", number: null }, Date.now(), SECRET)}`;
    const go = (url: string) => proxy(new NextRequest(url, { headers: { cookie } }));
    const plain = go("http://localhost/early-access");
    expect(plain.status).toBe(307);
    expect(new URL(plain.headers.get("location") ?? "").pathname).toBe("/team");
    const deep = go("http://localhost/early-access?next=%2Fx");
    expect(deep.status).toBe(307);
    expect(new URL(deep.headers.get("location") ?? "").pathname).toBe("/x");
  });
});
