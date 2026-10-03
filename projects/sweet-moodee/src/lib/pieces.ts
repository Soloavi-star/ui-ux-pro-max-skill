import { getImage } from "astro:assets";
import { getProducts, type Product } from "./catalog";
import { isSoldOut } from "./shop";

/** The light view of a product used by « Elle me va ? » (share sheet and friend page). */
export type Piece = {
  id: string;
  name: string;
  price: number;
  cat: string;
  soldOut: boolean;
  drop?: number; // ms timestamp, for pieces waiting for their drop
  src: string;
  srcset: string;
  thumb: string;
};

export async function toPiece(p: Product): Promise<Piece> {
  const [card, thumb] = await Promise.all([
    getImage({ src: p.data.image, widths: [240, 360, 476], format: "webp" }),
    getImage({ src: p.data.image, width: 128, format: "webp" }),
  ]);
  return {
    id: p.id,
    name: p.data.name,
    price: p.data.price,
    cat: p.data.category,
    soldOut: isSoldOut(p.data.stock),
    drop: p.data.drop?.getTime(),
    src: card.src,
    srcset: card.srcSet.attribute,
    thumb: thumb.src,
  };
}

let cache: Promise<Piece[]> | null = null;
export const getPieces = () => (cache ??= getProducts().then((all) => Promise.all(all.map(toPiece))));

/** JSON safe to inline in a <script> tag. */
export const inlineJson = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");
