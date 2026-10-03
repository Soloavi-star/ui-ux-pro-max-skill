// Renders the WhatsApp / social share images (1200×630) from HTML with the real fonts and photos.
// Usage: node scripts/make-og.mjs   (needs Playwright's Chromium; CHROMIUM_PATH to override)
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
// Inlined as data URIs: a page built with setContent may not read file:// resources.
const f = (p) => `data:${p.endsWith(".jpg") ? "image/jpeg" : "font/woff2"};base64,${readFileSync(resolve(root, p)).toString("base64")}`;
const photo = (n) => f(`src/assets/products/${n}.jpg`);

const base = `
  @font-face { font-family: Gloock; src: url(${f("node_modules/@fontsource/gloock/files/gloock-latin-400-normal.woff2")}); }
  @font-face { font-family: Grotesk; font-weight: 500; src: url(${f("node_modules/@fontsource/familjen-grotesk/files/familjen-grotesk-latin-500-normal.woff2")}); }
  @font-face { font-family: Grotesk; font-weight: 600; src: url(${f("node_modules/@fontsource/familjen-grotesk/files/familjen-grotesk-latin-600-normal.woff2")}); }
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; background: #120b10; color: #f7eee7; font-family: Grotesk; position: relative; }
  .k { font-size: 20px; letter-spacing: .22em; text-transform: uppercase; font-weight: 600; color: #e2b970; }
  .logo { font-family: Gloock; font-size: 34px; } .logo em { font-style: normal; color: #e8508f; }
  .ph { position: absolute; border-radius: 18px; overflow: hidden; background: #24141d; box-shadow: 0 20px 60px rgba(0,0,0,.45); }
  .ph img { width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; }
`;

const pages = {
  "public/og.jpg": `
    <style>${base}
      .txt { position: absolute; left: 72px; top: 70px; width: 560px; display: flex; flex-direction: column; gap: 26px; height: 490px; }
      h1 { font-family: Gloock; font-weight: 400; font-size: 96px; line-height: .98; }
      h1 em { font-style: normal; color: #e8508f; }
      p { font-size: 25px; color: #c9b7bf; line-height: 1.35; }
      .logo { margin-top: auto; }
    </style>
    <div class="txt"><span class="k">Vendredi, 22 h 14</span><h1>Samedi commence <em>ici.</em></h1>
      <p>Robes, combinaisons et ensembles à Abidjan. Commande en un message WhatsApp, paiement à la livraison.</p>
      <span class="logo">Sweet <em>Moodee</em></span></div>
    <div class="ph" style="left:690px; top:120px; width:215px; height:287px; transform: rotate(-4deg)"><img src="${photo("a12")}"></div>
    <div class="ph" style="left:850px; top:56px; width:250px; height:333px; z-index:2"><img src="${photo("b22")}"></div>
    <div class="ph" style="left:930px; top:300px; width:215px; height:287px; transform: rotate(5deg); z-index:3"><img src="${photo("a21")}"></div>`,
  "public/og-avis.jpg": `
    <style>${base}
      .txt { position: absolute; left: 72px; top: 76px; width: 560px; display: flex; flex-direction: column; gap: 22px; height: 480px; }
      .bub { width: fit-content; padding: 22px 30px 26px; border-radius: 30px; border-top-left-radius: 8px; background: #24141d; }
      .bub b { display: block; font-family: Gloock; font-weight: 400; font-size: 92px; line-height: 1; }
      .bub span { display: block; margin-top: 12px; font-size: 28px; color: #c9b7bf; }
      p { font-size: 25px; color: #c9b7bf; line-height: 1.35; }
      .logo { margin-top: auto; }
      .pick { outline: 5px solid #e8508f; outline-offset: 6px; }
      .pill { position: absolute; left: 16px; bottom: 16px; padding: 8px 16px; border-radius: 999px; background: #c2185f; font-weight: 600; font-size: 22px; }
    </style>
    <div class="txt"><span class="k">Ta copine hésite</span>
      <div class="bub"><b>Elle me va ?</b><span>Laquelle tu me conseilles pour samedi ?</span></div>
      <p>Donne ton avis en un geste, sur WhatsApp.</p>
      <span class="logo">Sweet <em>Moodee</em></span></div>
    <div class="ph" style="left:690px; top:110px; width:228px; height:304px; transform: rotate(-3deg); opacity:.55"><img src="${photo("b30")}"></div>
    <div class="ph pick" style="left:900px; top:150px; width:240px; height:320px; transform: rotate(3deg)"><img src="${photo("a12")}"><span class="pill">Ton choix</span></div>`,
};

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const [out, html] of Object.entries(pages)) {
  await page.setContent(`<!doctype html><html lang="fr"><meta charset="utf-8"><body>${html}</body></html>`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve(root, out), type: "jpeg", quality: 86 });
  console.log("écrit", out);
}
await browser.close();
