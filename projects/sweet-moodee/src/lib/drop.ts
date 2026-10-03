/**
 * Le drop du vendredi: pure date helpers shared by the build, the browser and the
 * unit tests (no DOM, no Astro). Abidjan is on GMT all year (UTC+0, no daylight
 * saving), so shop time is UTC and everything below uses the UTC getters.
 */

const WEEKDAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const DAY = 86_400_000;

/** The next weekly drop strictly after `now` (a drop at exactly `now` has already happened). */
export function nextWeeklyDrop(now: Date, weekday: number, hour: number): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour));
  d.setUTCDate(d.getUTCDate() + ((weekday - d.getUTCDay() + 7) % 7));
  if (d.getTime() <= now.getTime()) d.setUTCDate(d.getUTCDate() + 7);
  return d;
}

/**
 * A date typed by the shop (Google Sheet or catalogue), read as Abidjan time.
 * Accepts 2026-10-09, 2026-10-09 18:00, 09/10/2026, 09/10/2026 18h30, 09/10/2026 18:00:00
 * and ISO strings with a zone. Without a time, `defaultHour` applies. Unreadable → undefined.
 */
export function parseDropDate(raw: string, defaultHour: number): Date | undefined {
  const v = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}T.+(Z|[+-]\d{2}:?\d{2})$/i.test(v)) {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  const iso = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](.+))?$/);
  const fr = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(.+))?$/);
  const p = iso ? { y: +iso[1], mo: +iso[2], da: +iso[3], t: iso[4] } : fr ? { y: +fr[3], mo: +fr[2], da: +fr[1], t: fr[4] } : null;
  if (!p) return undefined;
  let h = defaultHour, mi = 0;
  if (p.t) {
    const t = p.t.trim().match(/^(\d{1,2})\s*(?:[:hH]\s*(\d{2})?)?(?::\d{2})?$/);
    if (!t) return undefined;
    h = +t[1];
    mi = t[2] ? +t[2] : 0;
  }
  if (p.mo < 1 || p.mo > 12 || p.da < 1 || h > 23 || mi > 59) return undefined;
  const d = new Date(Date.UTC(p.y, p.mo - 1, p.da, h, mi));
  return d.getUTCDate() === p.da && d.getUTCMonth() === p.mo - 1 ? d : undefined; // rejects 31/02
}

/** Whole remaining units; a partial second still counts, so 0 only once the drop is live. */
export function countdownParts(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/** Compact remaining time: "6 j 23 h", "5 h 07 min", "12 min 05 s", "8 s". */
export function formatCountdown(ms: number): string {
  const { d, h, m, s } = countdownParts(ms);
  const two = (n: number) => String(n).padStart(2, "0");
  if (d > 0) return `${d} j ${h} h`;
  if (h > 0) return `${h} h ${two(m)} min`;
  if (m > 0) return `${m} min ${two(s)} s`;
  return `${s} s`;
}

/** "18 h", "18 h 30" */
export const hourLabel = (d: Date) => `${d.getUTCHours()} h${d.getUTCMinutes() ? ` ${String(d.getUTCMinutes()).padStart(2, "0")}` : ""}`;

/** "vendredi 9 octobre à 18 h" */
export const dateLabel = (d: Date) => `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} à ${hourLabel(d)}`;

/** "Vendredi" within the coming week, "Vendredi 16 octobre" further out. */
export function dayLabel(d: Date, now: Date): string {
  const w = WEEKDAYS[d.getUTCDay()];
  const day = w[0].toUpperCase() + w.slice(1);
  return d.getTime() - now.getTime() >= 7 * DAY ? `${day} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}` : day;
}
