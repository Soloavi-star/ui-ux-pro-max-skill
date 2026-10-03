import { defineCollection, z } from "astro:content";
import { file } from "astro/loaders";
import { SIZES } from "./lib/shop";

export const CATEGORIES = ["Robes", "Combinaisons", "Ensembles"] as const;

// One product = one page at /produit/<id>. Stock is counted per size so
// "last piece" badges always reflect real stock, never invented scarcity.
const products = defineCollection({
  loader: file("src/data/products.json"),
  schema: ({ image }) =>
    z.object({
      name: z.string().min(3),
      category: z.enum(CATEGORIES),
      price: z.number().int().positive(),
      image: image(),
      gallery: z.array(image()).default([]),
      stock: z.record(z.enum(SIZES), z.number().int().min(0)),
      isNew: z.boolean().default(false),
      occasion: z.array(z.enum(["Soirée", "Anniversaire", "Mariage", "Brunch", "Journée"])).default([]),
      description: z.string().min(10),
    }),
});

export const collections = { products };
