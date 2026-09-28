// Team export of the early-adopter registry as CSV (GET /api/early-access/export): team session only.
import { isTeamEmail } from "./access";
import { listPeople, OFFSET, type Person, storePrefix } from "./registry";
import { verifySession } from "./session";

export const CSV_COLUMNS = [
  "number",
  "name",
  "email",
  "phone",
  "source",
  "verified",
  "locale",
  "host",
  "first_seen",
  "last_seen",
] as const;

/** RFC 4180 quoting, and a leading ' on cells a spreadsheet would read as a formula (= + - @, tab, CR). A phone
 *  number (+49...) therefore arrives as text, not as a number in scientific notation. */
function cell(v: unknown): string {
  let s = v === undefined || v === null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** UTF-8 BOM (Excel then shows the umlauts), a header row, one row per person sorted by number; number is the
 *  displayed one (n + OFFSET). */
export function peopleCsv(people: Partial<Person>[]): string {
  const rows = [...people]
    .sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
    .map((p) =>
      [
        typeof p.number === "number" ? p.number + OFFSET : "",
        p.name,
        p.email,
        p.phone,
        p.source,
        p.verified,
        p.locale,
        p.host,
        p.first_seen,
        p.last_seen,
      ]
        .map(cell)
        .join(","),
    );
  return `﻿${[CSV_COLUMNS.join(","), ...rows].join("\r\n")}\r\n`;
}

export type ExportResult =
  | { status: 401 | 403 | 503; json: { ok: false } }
  | { status: 200; csv: string; filename: string };

export async function exportPeople(
  sessionCookie: string | undefined,
  deps: { list?: () => Promise<Partial<Person>[]>; now?: Date; vercelEnv?: string; allow?: string } = {},
): Promise<ExportResult> {
  const session = verifySession(sessionCookie);
  if (!session) return { status: 401, json: { ok: false } };
  if (!isTeamEmail(session.id, deps.allow ?? process.env.GATE_ALLOW)) return { status: 403, json: { ok: false } };
  let people: Partial<Person>[];
  try {
    people = await (deps.list ?? (() => listPeople()))();
  } catch (e) {
    console.error("[early-access] export failed", e instanceof Error ? e.message : "unknown");
    return { status: 503, json: { ok: false } };
  }
  const env = deps.vercelEnv ?? storePrefix().split("/")[1];
  const day = (deps.now ?? new Date()).toISOString().slice(0, 10);
  return { status: 200, csv: peopleCsv(people), filename: `early-access-${env}-${day}.csv` };
}
