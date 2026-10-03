// @ts-check
import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";

// SITE_URL is the final domain; it drives canonical URLs, Open Graph and the sitemap.
export default defineConfig({
  site: process.env.SITE_URL ?? "https://sweetmoodee.com",
  output: "static",
  trailingSlash: "never",
  build: { format: "file" },
  integrations: [
    preact(),
    sitemap({
      // Friend pages are personal, and pieces waiting for their drop stay unlisted until the
      // rebuild that follows it (the set is filled by src/lib/catalog.ts during this same build).
      filter: (page) => {
        const path = new URL(page).pathname;
        if (path === "/avis") return false;
        const id = path.match(/^\/produit\/(.+)$/)?.[1];
        return !(id && /** @type {any} */ (globalThis).__smUnlisted?.has(id));
      },
    }),
  ],
  image: { responsiveStyles: true },
});
