import { test, expect, type Page, type Browser } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { gzipSync } from "node:zlib";
import products from "../src/data/products.json" with { type: "json" };

const PRODUCT = "robe-bustier-corset"; // stock: S 2, M 1, L 0, XL 0
const DROP_PIECE = "robe-sirene-anthracite"; // "drop": "prochain" in the demo catalogue
const live = products.filter((p) => !("drop" in p));

/** A product page whose size picker island has hydrated (Astro removes the ssr attribute). */
const openProduct = async (page: Page, id: string) => {
  await page.goto(`/produit/${id}`);
  await page.locator('astro-island[component-url*="SizePicker"]:not([ssr])').waitFor({ state: "attached" });
};

/** The drop time the build wrote into the home page. */
const dropAt = async (page: Page) => {
  await page.goto("/");
  return Date.parse((await page.locator("#drop").getAttribute("data-drop-at"))!);
};

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
    await expect(page.locator(".pc")).toHaveCount(live.length); // drop pieces wait for their hour
    await page.getByRole("button", { name: "Robes", exact: true }).click();
    const robes = live.filter((p) => p.category === "Robes").length;
    await expect(page.locator(".pc:visible")).toHaveCount(robes);
    await expect(page.locator("[data-count]")).toHaveText(`${robes} pièces`);
    await page.getByRole("button", { name: "Mariage" }).click();
    await expect(page.locator(".pc:visible")).toHaveCount(live.filter((p) => p.occasion.includes("Mariage")).length);
    await noOverflow(page);
  });
});

test.describe("fiche produit et commande", () => {
  test("taille obligatoire, taille épuisée = demande de réassort, lien WhatsApp direct", async ({ page }) => {
    await openProduct(page, PRODUCT);
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
    await openProduct(page, PRODUCT);
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

test("panier : un ajout fait avant que le panier soit chargé n'est jamais perdu", async ({ page }) => {
  // Slow phone: the cart island's code arrives late, after the tap on « Ajouter au panier ».
  await page.route(/\/_astro\/Cart\.[^/]+\.js$/, async (route) => { await new Promise((r) => setTimeout(r, 2500)); await route.continue(); });
  await openProduct(page, PRODUCT);
  await page.getByRole("radio", { name: "S" }).click();
  await page.getByRole("button", { name: "Ajouter au panier" }).click();
  await expect(page.locator("[data-cart-count]")).toHaveText("1", { timeout: 8000 });
});

test.describe("le drop du vendredi", () => {
  test("compte à rebours, teasers flous, puis révélation à l'heure pile", async ({ page }) => {
    await page.clock.install();
    const at = await dropAt(page);
    const drop = page.locator("#drop");
    await page.clock.pauseAt(at - 65_000);
    await page.clock.runFor(1_000);
    await drop.scrollIntoViewIfNeeded();
    await expect(drop.locator("[data-cd='m']")).toHaveText("01");
    await expect(drop.locator("[data-tile]")).toHaveCount(4);
    // Before the hour the real cards are only in inert <template>s: no name, no photo in the page
    await expect(drop.getByRole("link", { name: /Robe sirène anthracite/ })).toHaveCount(0);
    await page.clock.runFor(66_000);
    await expect(drop).toHaveClass(/is-live/);
    await expect(drop.getByRole("heading", { name: "Les pièces sont en ligne." })).toBeVisible();
    await expect(drop.getByRole("link", { name: /Robe sirène anthracite/ })).toBeVisible();
    await noOverflow(page);
  });

  test("ouverte après l'heure : les pièces sont déjà là", async ({ page }) => {
    const at = await dropAt(page);
    await page.clock.install({ time: at + 60_000 });
    await page.reload();
    await expect(page.locator("#drop")).toHaveClass(/is-live/);
    await expect(page.locator("#drop .pc")).toHaveCount(4);
  });

  test("répétition pour la démo : ?demo-drop révèle en 10 secondes", async ({ page }) => {
    await page.clock.install();
    await page.goto("/?demo-drop");
    await expect(page.locator("#drop")).not.toHaveClass(/is-live/);
    await page.clock.runFor(11_000);
    await expect(page.locator("#drop")).toHaveClass(/is-live/);
  });

  test("fiche d'une pièce du drop : verrouillée jusqu'à l'heure, hors index", async ({ page }) => {
    const at = await dropAt(page);
    await page.clock.install({ time: at - 5_000 });
    await page.goto(`/produit/${DROP_PIECE}`);
    await expect(page.getByText(/Disponible vendredi \d+ \w+ à 18 h/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Ajouter au panier" })).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
    await page.clock.runFor(6_000);
    await expect(page.getByRole("button", { name: "Ajouter au panier" })).toBeVisible();
  });

  test("boutique : bandeau vers le drop", async ({ page }) => {
    await page.goto("/boutique");
    await expect(page.getByRole("link", { name: /Le drop du vendredi/ })).toHaveAttribute("href", "/#drop");
    await expect(page.locator(`a[href="/produit/${DROP_PIECE}"]`)).toHaveCount(0);
  });
});

test.describe("Elle me va ?", () => {
  test("la cliente compose sa question : pièces, prénom, aperçu, lien", async ({ page }) => {
    await page.goto(`/produit/${PRODUCT}`);
    const ask = page.getByRole("button", { name: /Elle me va \?/ });
    await ask.click();
    const sheet = page.getByRole("dialog", { name: "Elle me va ?" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("button", { name: /Robe bustier corset/ })).toHaveAttribute("aria-pressed", "true");
    const other = sheet.locator(".sh-th").nth(1); // appears once the light catalogue has loaded
    await other.click();
    await expect(other).toHaveAttribute("aria-pressed", "true");
    await sheet.getByLabel(/Ton prénom/).fill("Aya");
    await expect(sheet.locator("[data-preview]")).toContainText("J'hésite entre 2 tenues pour samedi");
    const href = decodeURIComponent((await sheet.getByRole("link", { name: /Envoyer à une copine/ }).getAttribute("href"))!);
    expect(href).toMatch(/^https:\/\/wa\.me\/\?text=Coucou/);
    expect(href).toMatch(/\/avis\?p=robe-bustier-corset,[a-z-]+&de=Aya&utm_source=amie$/);
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(ask).toBeFocused();
  });

  test("la copine choisit : sa réponse part sur WhatsApp et elle devient cliente tracée", async ({ page }) => {
    await page.goto("/avis?p=robe-bustier-corset,combinaison-bordeaux-ceinturee&de=Aya&utm_source=amie");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Aya hésite pour samedi");
    await expect(page.locator(".av-card")).toHaveCount(2);
    const send = page.getByRole("link", { name: "Envoyer ma réponse à Aya" });
    await expect(send).toBeHidden();
    await page.getByRole("button", { name: "Choisir Combinaison bordeaux ceinturée" }).click();
    await expect(send).toBeVisible();
    const msg = decodeURIComponent((await send.getAttribute("href"))!);
    expect(msg).toContain("Mon choix : Combinaison bordeaux ceinturée 😍");
    expect(msg).toContain("/produit/combinaison-bordeaux-ceinturee");
    await expect.poll(() => page.evaluate(() => localStorage.getItem("sm-source"))).toBe('"amie"');
    await noOverflow(page);
  });

  test("une seule pièce : « Oui, fonce » ou « Bof »", async ({ page }) => {
    await page.goto("/avis?p=robe-bustier-corset");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Ta copine hésite pour samedi");
    await page.getByRole("button", { name: "Bof 🤔" }).click();
    const msg = decodeURIComponent((await page.getByRole("link", { name: /Envoyer ma réponse/ }).getAttribute("href"))!);
    expect(msg).toContain("Bof");
    expect(msg).toContain("/boutique");
  });

  test("un lien piégé ne peut rien injecter, un lien vide reste utile", async ({ page }) => {
    let alerted = false;
    page.on("dialog", (d) => { alerted = true; d.dismiss(); });
    await page.goto(`/avis?p=${PRODUCT}&de=${encodeURIComponent("<img src=x onerror=alert(1)>")}`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("img src=x");
    await expect(page.locator('img[src="x"]')).toHaveCount(0);
    expect(alerted).toBe(false);
    await page.goto("/avis?p=nimporte-quoi");
    await expect(page.getByText(/Ce lien ne montre plus de pièces/)).toBeVisible();
  });
});

test.describe("qualité", () => {
  test("accessibilité : aucune violation sérieuse", async ({ page }) => {
    for (const path of ["/boutique", `/produit/${PRODUCT}`, "/livraison-retours", `/avis?p=${PRODUCT},combinaison-bordeaux-ceinturee&de=Aya`]) {
      await page.goto(path);
      await page.waitForTimeout(1600); // let the friend page intro finish (axe reads mid-fade opacity)
      await axe(page);
    }
    await page.goto(`/produit/${PRODUCT}`);
    await page.getByRole("button", { name: /Elle me va \?/ }).click();
    await page.waitForTimeout(500);
    await axe(page);
    await page.goto("/");
    await page.locator("#drop").scrollIntoViewIfNeeded();
    await axe(page);
    await page.goto("/");
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await axe(page);
  });

  test("budget de poids JavaScript (compressé)", async ({ browser }, info) => {
    test.skip(info.project.name !== "phone", "measured once");
    const home = await jsWeight(browser, "/");
    const product = await jsWeight(browser, `/produit/${PRODUCT}`);
    const avis = await jsWeight(browser, `/avis?p=${PRODUCT}`);
    console.log(`JS gzip — accueil : ${(home / 1024).toFixed(1)} Ko, fiche produit : ${(product / 1024).toFixed(1)} Ko, page copine : ${(avis / 1024).toFixed(1)} Ko`);
    expect(avis).toBeLessThan(25 * 1024);
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
    const map = await sm.text();
    expect(map).toContain(`/produit/${PRODUCT}`);
    expect(map).not.toContain(`/produit/${DROP_PIECE}`); // listed after the drop's rebuild
    expect(map).not.toContain("/avis");
  });
});
