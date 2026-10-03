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
  integrations: [preact(), sitemap()],
  image: { responsiveStyles: true },
});
