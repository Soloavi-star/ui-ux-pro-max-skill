import { test, expect, type Page, type Browser } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { gzipSync } from "node:zlib";
import products from "../src/data/products.json" with { type: "json" };

const PRODUCT = "robe-bustier-corset"; // stock: S 2, M 1, L 0, XL 0

const noOverflow = async (page: Page) =>
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

const axe = async (page: Page) => {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
};

/** Gzipped JS weight a first visit downloads (fresh context = cold cache). */
async function jsWeight(browser: Browser, path: string) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const sizes: Promise<number>[] = [];
  page.on("response", (r) => {
    if (r.status() >= 300) return; // redirects have no body
    if (r.url().endsWith(".js") || (r.headers()["content-type"] ?? "").includes("javascript")) sizes.push(r.body().then((b) => gzipSync(b).length));
  });
  await page.goto(path, { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(800);
  const total = (await Promise.all(sizes)).reduce((a, b) => a + b, 0);
  await ctx.close();
  return total;
}

test.describe("accueil : histoire Samedi soir", () => {
  test("la conversation avance au scroll puis devient le site", async ({ page }) => {
    await page.goto("/");
    const story = page.locator("#histoire");
    const span = await story.evaluate((el) => (el as HTMLElement).offsetHeight - innerHeight);
    await page.evaluate((y) => scrollTo(0, y), Math.round(span * 0.08));
    await expect(page.locator("[data-field]")).toContainText("Samedi");
    await page.evaluate((y) => scrollTo(0, y), Math.round(span * 0.66));
    await expect(page.locator("[data-card]")).toBeVisible();
    await page.evaluate((y) => scrollTo(0, y), span);
    await expect(page.getByRole("heading", { name: "Samedi commence ici." })).toBeVisible();
    await expect(page.locator("body")).toHaveClass(/story-done/);
    await noOverflow(page);
  });

  test("« Passer l'histoire » mène à l'écran d'ouverture de la boutique", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Passer l'histoire" }).click();
    await expect(page.getByRole("heading", { name: "Samedi commence ici." })).toBeVisible({ timeout: 5000 });
  });

  test("moins d'animations : la conversation s'affiche en entier, sans histoire au scroll", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(page.getByText("J'ai RIEN à me mettre 😭😭")).toBeVisible();
    await expect(page.locator("#histoire")).toHaveClass(/st-static/);
    await ctx.close();
  });
});

test.describe("boutique", () => {
  test("toutes les pièces, filtres par type et par occasion", async ({ page }) => {
    await page.goto("/boutique");
    await expect(page.locator(".pc")).toHaveCount(products.length);
    await page.getByRole("button", { name: "Robes", exact: true }).click();
    const robes = products.filter((p) => p.category === "Robes").length;
    await expect(page.locator(".pc:visible")).toHaveCount(robes);
    await expect(page.locator("[data-count]")).toHaveText(`${robes} pièces`);
    await page.getByRole("button", { name: "Mariage" }).click();
    await expect(page.locator(".pc:visible")).toHaveCount(products.filter((p) => p.occasion.includes("Mariage")).length);
    await noOverflow(page);
  });
});

test.describe("fiche produit et commande", () => {
  test("taille obligatoire, taille épuisée = demande de réassort, lien WhatsApp direct", async ({ page }) => {
    await page.goto(`/produit/${PRODUCT}`);
    await expect(page.getByRole("heading", { level: 1, name: "Robe bustier corset" })).toBeVisible();
    await expect(page.getByText("28 000 FCFA").first()).toBeVisible();
    const direct = page.getByRole("link", { name: "Commander en 1 message WhatsApp" });
    await direct.click();
    await expect(page.getByText("Choisis ta taille.")).toBeVisible();
    await expect(page.getByRole("link", { name: /Taille L épuisée/ })).toHaveAttribute("href", /wa\.me\/\d+\?text=.*taille%20L/);
    await page.getByRole("radio", { name: "M" }).click();
    await expect(page.getByText("Dernière pièce dans cette taille.")).toBeVisible();
    const href = await direct.getAttribute("href");
    expect(decodeURIComponent(href!)).toContain("Robe bustier corset — taille M — 28 000 FCFA");
    await noOverflow(page);
  });

  test("panier : ajout, badge, formulaire validé, message WhatsApp complet", async ({ page }) => {
    await page.goto(`/produit/${PRODUCT}`);
    await page.getByRole("radio", { name: "S" }).click();
    await page.getByRole("button", { name: "Ajouter au panier" }).click();
    await expect(page.locator("[data-cart-count]")).toHaveText("1");
    await page.locator("header [data-open-cart]").click();
    const cart = page.getByRole("dialog");
    await expect(cart.getByText("Robe bustier corset")).toBeVisible();
    await expect(cart.getByText(/pour la livraison offerte/)).toBeVisible();
    await cart.getByRole("button", { name: "Continuer" }).click();
    const send = cart.getByRole("link", { name: "Envoyer la commande sur WhatsApp" });
    await send.click();
    await expect(cart.getByText("Indique ton nom pour la livraison.")).toBeVisible();
    await cart.getByLabel("Ton prénom et nom").fill("Aya Kouassi");
    await cart.getByLabel("Commune de livraison").selectOption("Cocody");
    const msg = decodeURIComponent((await send.getAttribute("href"))!.split("text=")[1]);
    expect(msg).toContain("Robe bustier corset — taille S — 1 × 28 000 FCFA");
    expect(msg).toContain("Livraison (Cocody) : 1 500 FCFA");
    expect(msg).toContain("Total à payer à la livraison : 29 500 FCFA");
    await page.keyboard.press("Escape");
    await expect(cart).toBeHidden();
    // The basket survives a reload (retention)
    await page.reload();
    await expect(page.locator("[data-cart-count]")).toHaveText("1");
  });
});

test.describe("qualité", () => {
  test("accessibilité : aucune violation sérieuse", async ({ page }) => {
    for (const path of ["/boutique", `/produit/${PRODUCT}`, "/livraison-retours"]) {
      await page.goto(path);
      await axe(page);
    }
    await page.goto("/");
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await axe(page);
  });

  test("budget de poids JavaScript (compressé)", async ({ browser }, info) => {
    test.skip(info.project.name !== "phone", "measured once");
    const home = await jsWeight(browser, "/");
    const product = await jsWeight(browser, `/produit/${PRODUCT}`);
    console.log(`JS gzip — accueil : ${(home / 1024).toFixed(1)} Ko, fiche produit : ${(product / 1024).toFixed(1)} Ko`);
    expect(home).toBeLessThan(40 * 1024);
    expect(product).toBeLessThan(25 * 1024);
  });

  test("SEO : titre, description, Open Graph, JSON-LD produit, sitemap", async ({ page, request }) => {
    await page.goto(`/produit/${PRODUCT}`);
    await expect(page).toHaveTitle("Robe bustier corset · Sweet Moodee");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /^https:\/\/.+\.jpg$/);
    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
    expect(ld["@type"]).toBe("Product");
    expect(ld.offers.priceCurrency).toBe("XOF");
    const sm = await request.get("/sitemap-0.xml");
    expect(await sm.text()).toContain(`/produit/${PRODUCT}`);
  });
});
