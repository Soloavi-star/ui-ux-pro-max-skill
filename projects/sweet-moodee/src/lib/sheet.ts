import { DROP } from "../config";
import { parseDropDate } from "./drop";
import { SIZES, type Size } from "./shop";

/**
 * Optional live overrides from the shop's Google Sheet (published as CSV).
 * Columns: id, price, S, M, L, XL, hidden, drop. The repo keeps photos and texts;
 * the Sheet only changes price, stock, visibility and drop date, so a typo can never break a page.
 * drop: a date (09/10/2026, 09/10/2026 18h30…) schedules the piece; "non" publishes it now;
 * an empty cell keeps the catalogue value.
 */
export type Override = { price?: number; stock?: Partial<Record<Size, number>>; hidden?: boolean; drop?: Date | null };

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((x) => x.trim()));
  if (!head) return [];
  const keys = head.map((h) => h.trim().toLowerCase());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

export function toOverrides(rows: Record<string, string>[]): Map<string, Override> {
  const out = new Map<string, Override>();
  const int = (v: string | undefined) => (v && /^\d+$/.test(v) ? Number(v) : undefined);
  for (const r of rows) {
    if (!r.id) continue;
    const stock: Partial<Record<Size, number>> = {};
    for (const s of SIZES) { const n = int(r[s.toLowerCase()]); if (n !== undefined) stock[s] = n; }
    const rawDrop = (r.drop ?? "").trim();
    let drop: Date | null | undefined;
    if (/^(non|aucun|-|0)$/i.test(rawDrop)) drop = null;
    else if (rawDrop) {
      drop = parseDropDate(rawDrop, DROP.hour);
      if (!drop) console.warn(`[sheet] ${r.id} : date de drop illisible « ${rawDrop} », ignorée.`);
    }
    out.set(r.id, {
      drop,
      price: int(r.price),
      stock: Object.keys(stock).length ? stock : undefined,
      hidden: ["oui", "yes", "1", "true", "x"].includes((r.hidden ?? "").toLowerCase()),
    });
  }
  return out;
}

