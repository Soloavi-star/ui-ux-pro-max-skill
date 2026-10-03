import { getCollection, type CollectionEntry } from "astro:content";
import { parseCsv, toOverrides } from "./sheet";

export type Product = CollectionEntry<"products">;

let cache: Promise<Product[]> | null = null;

export function getProducts(): Promise<Product[]> {
  cache ??= (async () => {
    const base = await getCollection("products");
    const url = import.meta.env.SHEET_CSV_URL as string | undefined;
    if (!url) return base;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const o = toOverrides(parseCsv(await res.text()));
      return base
        .filter((p) => !o.get(p.id)?.hidden)
        .map((p) => {
          const x = o.get(p.id);
          if (!x) return p;
          return { ...p, data: { ...p.data, price: x.price ?? p.data.price, stock: { ...p.data.stock, ...x.stock } } };
        });
    } catch (e) {
      // Never ship a broken shop because the Sheet is unreachable: fall back to the repo catalogue.
      console.warn(`[catalog] Google Sheet ignoré (${(e as Error).message}) — catalogue du dépôt utilisé.`);
      return base;
    }
  })();
  return cache;
}

/** Other categories first (to complete the look), then same category. */
export function related(all: Product[], p: Product, n = 4): Product[] {
  const others = all.filter((x) => x.id !== p.id);
  const cross = others.filter((x) => x.data.category !== p.data.category);
  const same = others.filter((x) => x.data.category === p.data.category);
  return [...cross, ...same].slice(0, n);
}
