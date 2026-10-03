import { getCollection, type CollectionEntry } from "astro:content";
import { DROP, SHOP } from "../config";
import { nextWeeklyDrop } from "./drop";
import { parseCsv, toOverrides, type Override } from "./sheet";

type Entry = CollectionEntry<"products">;
/** A product as the site uses it: drop resolved to a date, "new" including last week's drop. */
export type Product = Entry & { data: Entry["data"] & { drop?: Date } };

/** One clock for the whole build, so every page agrees on what is already live. */
export const BUILD_NOW = new Date();
const WEEK = 7 * 86_400_000;

export const isUpcoming = (p: Product, now = BUILD_NOW) => !!p.data.drop && p.data.drop.getTime() > now.getTime();

function resolveDrop(v: Entry["data"]["drop"] | Date | null | undefined, id: string): Date | undefined {
  if (v === "prochain") {
    // Demo value only: always the next Friday after the build. In production a fixed date is
    // required, otherwise every rebuild after the drop would push the pieces back a week.
    if (!SHOP.isMockup) throw new Error(`[catalog] ${id} : « drop: prochain » est réservé à la maquette, indique une date.`);
    return nextWeeklyDrop(BUILD_NOW, DROP.weekday, DROP.hour);
  }
  return v ?? undefined;
}

async function sheetOverrides(): Promise<Map<string, Override> | null> {
  const url = import.meta.env.SHEET_CSV_URL as string | undefined;
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return toOverrides(parseCsv(await res.text()));
  } catch (e) {
    // Never ship a broken shop because the Sheet is unreachable: fall back to the repo catalogue.
    console.warn(`[catalog] Google Sheet ignoré (${(e as Error).message}) — catalogue du dépôt utilisé.`);
    return null;
  }
}

let cache: Promise<Product[]> | null = null;

/** Every product, including pieces waiting for their drop (their pages exist, locked until then). */
export function getProducts(): Promise<Product[]> {
  cache ??= (async () => {
    const [base, o] = await Promise.all([getCollection("products"), sheetOverrides()]);
    const all = base
      .filter((p) => !o?.get(p.id)?.hidden)
      .map((p) => {
        const x = o?.get(p.id);
        const drop = resolveDrop(x && x.drop !== undefined ? x.drop : p.data.drop, p.id);
        const justDropped = !!drop && drop <= BUILD_NOW && BUILD_NOW.getTime() - drop.getTime() < WEEK;
        return {
          ...p,
          data: { ...p.data, price: x?.price ?? p.data.price, stock: { ...p.data.stock, ...x?.stock }, drop, isNew: p.data.isNew || justDropped },
        } as Product;
      });
    // Read by the sitemap filter in astro.config.mjs (same build process): locked pages stay out of it.
    (globalThis as { __smUnlisted?: Set<string> }).__smUnlisted = new Set(all.filter((p) => isUpcoming(p)).map((p) => p.id));
    return all;
  })();
  return cache;
}

/** What the shop shows today: everything except pieces waiting for their drop. */
export async function getLive(): Promise<Product[]> {
  return (await getProducts()).filter((p) => !isUpcoming(p));
}

/**
 * The next drop: its date and pieces, or — when nothing is scheduled — the next weekly
 * slot with no pieces (the section then works as a reminder). null when drops are off.
 */
export async function getNextDrop(): Promise<{ at: Date; pieces: Product[] } | null> {
  if (!DROP.enabled) return null;
  const upcoming = (await getProducts()).filter((p) => isUpcoming(p)).sort((a, b) => a.data.drop!.getTime() - b.data.drop!.getTime());
  if (!upcoming.length) return { at: nextWeeklyDrop(BUILD_NOW, DROP.weekday, DROP.hour), pieces: [] };
  const at = upcoming[0].data.drop!;
  return { at, pieces: upcoming.filter((p) => p.data.drop!.getTime() === at.getTime()) };
}

/** Other categories first (to complete the look), then same category. */
export function related(all: Product[], p: Product, n = 4): Product[] {
  const others = all.filter((x) => x.id !== p.id);
  const cross = others.filter((x) => x.data.category !== p.data.category);
  const same = others.filter((x) => x.data.category === p.data.category);
  return [...cross, ...same].slice(0, n);
}
