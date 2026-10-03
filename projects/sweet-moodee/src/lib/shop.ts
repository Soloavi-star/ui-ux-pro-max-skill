import { SHOP, ZONES } from "../config";

export const SIZES = ["S", "M", "L", "XL"] as const;
export type Size = (typeof SIZES)[number];
export type Stock = Partial<Record<Size, number>>;

/** 36000 → "36 000 FCFA" (regular spaces, safe in WhatsApp messages). */
export const fcfa = (n: number) => `${Math.round(n).toLocaleString("fr-FR").replace(/[  ]/g, " ")} FCFA`;

export const available = (stock: Stock) => SIZES.filter((s) => (stock[s] ?? 0) > 0);
export const isSoldOut = (stock: Stock) => available(stock).length === 0;
/** Sizes with exactly one piece left, from real stock. */
export const lastPieces = (stock: Stock) => SIZES.filter((s) => stock[s] === 1);

export const waLink = (text: string, to: string = SHOP.whatsapp) =>
  `https://wa.me/${to}?text=${encodeURIComponent(text)}`;

/** A share link with no recipient: WhatsApp opens the contact picker. */
export const waShare = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;

export type Line = { id: string; name: string; size: Size; qty: number; price: number };

type CartWindow = Window & { smCartReady?: boolean; smPending?: Line[] };
/**
 * Add a line to the cart island. Islands hydrate in any order (the cart waits for idle time),
 * so a tap that lands before the cart is listening is queued, never lost.
 */
export function addToCart(line: Line) {
  const w = window as CartWindow;
  if (w.smCartReady) dispatchEvent(new CustomEvent("sm:add", { detail: line }));
  else (w.smPending ??= []).push(line);
}
/** Called once by the cart when it is listening: returns and clears the queued lines. */
export function takePending(): Line[] {
  const w = window as CartWindow;
  w.smCartReady = true;
  const lines = w.smPending ?? [];
  w.smPending = [];
  return lines;
}

export function deliveryFee(zone: string | undefined, subtotal: number): number | null {
  const z = ZONES.find((x) => x.name === zone);
  if (!z) return null;
  return subtotal >= SHOP.freeDeliveryFrom ? 0 : z.fee;
}

/** The order message the shop receives on WhatsApp. Pure, so it is unit-testable. */
export function orderMessage(p: { lines: Line[]; name: string; zone: string; place?: string; source?: string; siteUrl?: string }): string {
  const subtotal = p.lines.reduce((a, l) => a + l.price * l.qty, 0);
  const fee = deliveryFee(p.zone, subtotal);
  const items = p.lines.map((l) => `• ${l.name} — taille ${l.size} — ${l.qty} × ${fcfa(l.price)}`).join("\n");
  return [
    `Bonjour ${SHOP.name} ! Voici ma commande :`,
    items,
    "",
    `Sous-total : ${fcfa(subtotal)}`,
    `Livraison (${p.zone}) : ${fee === null ? "à confirmer" : fee === 0 ? "offerte" : fcfa(fee)}`,
    `Total à payer à la livraison : ${fcfa(subtotal + (fee ?? 0))}`,
    "",
    `Nom : ${p.name}`,
    `Commune : ${p.zone}`,
    `Repère / adresse : ${p.place?.trim() || "—"}`,
    "",
    `(Commande depuis le site${p.source ? ` · ${p.source}` : ""})`,
  ].join("\n");
}
