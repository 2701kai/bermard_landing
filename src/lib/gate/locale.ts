// Gate page language: the `lang` cookie (set by the DE/EN/IT switcher), else Accept-Language, else en.
export const LOCALES = ["de", "en", "it"] as const;
export type Locale = (typeof LOCALES)[number];
export const LANG_COOKIE = "lang";

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

export function pickLocale(cookie: string | null | undefined, acceptLanguage: string | null | undefined): Locale {
  if (isLocale(cookie)) return cookie;
  const ranked = (acceptLanguage ?? "")
    .split(",")
    .map((part, i) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const weight = q ? Number(q.slice(2)) : 1;
      return { lang: tag.trim().split("-")[0]?.toLowerCase() ?? "", q: Number.isFinite(weight) ? weight : 0, i };
    })
    .filter((x) => x.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  const hit = ranked.map((x) => x.lang).find(isLocale);
  return hit ?? "en";
}
