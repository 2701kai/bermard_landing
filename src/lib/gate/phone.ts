// Callback request phone numbers: spaces, dashes, dots and parentheses go, a leading 00 becomes +, and what is left
// must be + followed by 8 to 15 digits (E.164 length). Anything else is null.
export function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let p = raw.replace(/[\s.()-]/g, "");
  if (p.startsWith("00")) p = `+${p.slice(2)}`;
  return /^\+\d{8,15}$/.test(p) ? p : null;
}
