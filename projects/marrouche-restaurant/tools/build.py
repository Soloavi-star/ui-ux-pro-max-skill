#!/usr/bin/env python3
"""Assemble les pages du site Marrouche.

    python3 tools/build.py

Entrées : src/pages/*.html (+ src/partials/*.html), data/menu.json
Sorties : *.html à la racine du projet, assets/js/menu-data.js

Macros disponibles dans les pages :
  [[img nom land|port "sizes" "alt" eager?]]   image WebP responsive (assets/img/nom-*.webp)
  [[card id-plat nom-image #couleur "texte" Badge?]]
  [[categories]]  [[catnav]]  [[menu]]  [[map]]  [[faq]]
"""
import html, json, os, re, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
WORST = os.environ.get("WORST") == "1"  # break-ui : page de développement avec données « pire cas »
MENU = json.loads((ROOT / ("data/menu.worst.json" if WORST else "data/menu.json")).read_text(encoding="utf-8"))
DISHES = {d["id"]: {**d, "cat": c["id"]} for c in MENU["categories"] for d in c["items"]}
SITE = "https://marroucheabidjan.com/"
NNBSP = " "

FAQ = [
    ("Comment commander en livraison ?",
     "Ajoutez vos plats depuis la carte, puis envoyez la commande sur WhatsApp : le message est déjà rédigé. Nous vous confirmons le délai et les frais selon votre quartier avant de lancer la préparation."),
    ("Faut-il réserver ?",
     "C'est conseillé le week-end et pour les groupes. Envoyez votre demande depuis la page Réserver : la table est confirmée après notre réponse."),
    ("Avez-vous des plats végétariens ?",
     "Oui : houmous, taboulé, moutabbal, falafel, manaïch au zaatar et bien d'autres. Utilisez le filtre « Végé » sur la carte."),
    ("Le plat du jour change-t-il ?",
     "Oui, il change selon le jour. Demandez celui d'aujourd'hui sur WhatsApp ou par téléphone."),
    ("Organisez-vous des anniversaires et des repas d'entreprise ?",
     "Oui. Faites une demande de devis groupe : nous revenons vers vous avec une proposition de menu."),
    ("Quels moyens de paiement acceptez-vous ?",
     "Liste à confirmer par le restaurant (espèces, Mobile Money, carte bancaire…)."),
]


def esc(s):
    return html.escape(s, quote=True)


def fcfa(n):
    return "Offert" if n == 0 else f"{n:,}".replace(",", NNBSP) + " FCFA"


# ---------- images ----------
_dims = {}


def dims(path):
    if path not in _dims:
        out = subprocess.run(["identify", "-format", "%w %h", str(path)], capture_output=True, text=True, check=True).stdout
        _dims[path] = tuple(int(x) for x in out.split())
    return _dims[path]


def img(name, kind, sizes, alt, eager=False):
    if kind == "auto":
        kind = "land" if (ROOT / f"assets/img/{name}-480.webp").exists() else "port"
    widths = [480, 960, 1600] if kind == "land" else [400, 800, 1200]
    files = [f"assets/img/{name}-{w}.webp" for w in widths]
    for f in files:
        assert (ROOT / f).exists(), f
    w, h = dims(ROOT / files[-1])
    srcset = ", ".join(f"{f} {w_}w" for f, w_ in zip(files, widths))
    load = 'fetchpriority="high"' if eager else 'loading="lazy"'
    return (f'<img src="{files[1]}" srcset="{srcset}" sizes="{esc(sizes)}" width="{w}" height="{h}" '
            f'alt="{esc(alt)}" decoding="async" {load}>')


def add_control(d):
    n = esc(d["name"])
    return (f'<div class="add" data-add="{d["id"]}">'
            f'<button class="add__btn" type="button" data-add-btn aria-label="Ajouter {n} à la commande">'
            f'<svg class="icon"><use href="#i-plus"/></svg><span>Ajouter</span></button>'
            f'<div class="add__step"><button type="button" data-dec aria-label="Retirer un {n}"><svg class="icon"><use href="#i-minus"/></svg></button>'
            f'<output data-qty>0</output>'
            f'<button type="button" data-inc aria-label="Ajouter un autre {n}"><svg class="icon"><use href="#i-plus"/></svg></button></div></div>')


def card(did, image, ph, text, badge=None):
    d = DISHES[did]
    b = f'<span class="badge glass">{esc(badge)}</span>' if badge else ""
    return (f'<article class="dish-card">'
            f'<div class="dish-card__media" style="--ph:{ph}">{b}{img(image, "auto", "(min-width: 1024px) 26rem, 78vw", d["name"])}</div>'
            f'<div class="dish-card__body"><h3>{esc(d["name"])}</h3><p>{esc(text)}</p>'
            f'<div class="dish-card__foot"><span class="price">{fcfa(d["price"])}</span>{add_control(d)}</div></div></article>')


def panel(did, image, ph, num, text):
    d = DISHES[did]
    return (f'<article class="panel panel--dish"><div class="panel__media" style="--ph:{ph}">{img(image, "auto", "(min-width: 1024px) 34rem, 80vw", d["name"])}</div>'
            f'<div class="panel__body"><span class="panel__num">{esc(num)}</span><h3>{esc(d["name"])}</h3><p>{esc(text)}</p>'
            f'<div class="panel__foot"><span class="price">{fcfa(d["price"])}</span>{add_control(d)}</div></div></article>')


def stack(did, image, ph, title, text):
    d = DISHES[did]
    return (f'<article class="stack__card" data-stack-card><div class="stack__media" style="--ph:{ph}">{img(image, "auto", "(min-width: 1024px) 70rem, 100vw", d["name"])}</div>'
            f'<div class="stack__body"><h3>{esc(title)}</h3><p>{esc(text)}</p>'
            f'<div class="stack__foot"><span><b>{esc(d["name"])}</b> · <span class="price">{fcfa(d["price"])}</span></span>{add_control(d)}</div></div></article>')


COMPOSER = {
    "mezze": ["mezzes--homos", "mezzes--taboule", "mezzes--fattouche", "mezzes--moutabbal", "mezzes--batata-harra",
              "mezzes--feuilles-de-vigne-a-l-huile-d-olive", "mezzes--kebbe-grille-6-pieces", "mezzes--homos-viande",
              "mezzes--rouleaux-au-fromage", "mezzes--baba-ghannouj", "mezzes--fatayer-viande"],
    "salade": ["salades--salade-libanaise"],
    "grill": ["grillades--brochettes-mix", "grillades--brochettes-taouk", "grillades--brochettes-kafta",
              "grillades--poulet-au-charbon", "grillades--arayes-viande"],
    "dessert": ["desserts--kataief", "desserts--mehalabie", "desserts--crepe-marrouche"],
}


def composer_data():
    out = {g: [{"id": i, "name": DISHES[i]["name"], "price": DISHES[i]["price"], "img": DISHES[i]["img"]} for i in ids]
           for g, ids in COMPOSER.items()}
    return json.dumps(out, ensure_ascii=False).replace("</", "<\\/")


def categories():
    return "\n".join(
        f'<a href="menu.html#{c["id"]}"><b>{esc(c["label"])}</b><i aria-hidden="true"></i><span>{len(c["items"])} plats</span></a>'
        for c in MENU["categories"])


def catnav():
    cur = ' aria-current="true"'
    return "\n".join(
        f'<a href="#{c["id"]}" data-cat="{c["id"]}"{cur if i == 0 else ""}>{esc(c["label"])} <span>{len(c["items"])}</span></a>'
        for i, c in enumerate(MENU["categories"]))


TAGS = {"végé": ('tag', 'i-leaf', 'Végé'), "épicé": ('tag tag--hot', 'i-flame', 'Épicé')}


def dish_row(d):
    initial = esc(d["name"][0])
    if d["img"]:
        thumb = (f'<img src="{esc(d["img"])}" alt="" width="144" height="144" loading="lazy" decoding="async" '
                 f'referrerpolicy="no-referrer" data-thumb><span aria-hidden="true">{initial}</span>')
    else:
        thumb = f'<span aria-hidden="true">{initial}</span>'
    tags = "".join(f'<span class="{TAGS[t][0]}"><svg class="icon"><use href="#{TAGS[t][1]}"/></svg>{TAGS[t][2]}</span>' for t in d["tags"])
    desc = f'<p class="dish__desc">{esc(d["desc"])}</p>' if d["desc"] else ""
    search = esc(f'{d["name"]} {d["desc"]} {" ".join(d["tags"])}'.lower())
    return (f'<li class="dish" data-dish data-veg="{"1" if "végé" in d["tags"] else "0"}" data-search="{search}">'
            f'<div class="dish__thumb">{thumb}</div>'
            f'<div class="dish__main"><h3 class="dish__name">{esc(d["name"])}</h3>{desc}'
            f'<div class="dish__meta"><span class="price">{fcfa(d["price"])}</span>{tags}</div></div>'
            f'{add_control(d)}</li>')


def menu():
    out = []
    for c in MENU["categories"]:
        note = f'<p class="menu-group__note">{esc(c["note"])}</p>' if c["note"] else ""
        out.append(f'<section class="menu-group" id="{c["id"]}" aria-labelledby="h-{c["id"]}" data-group>'
                   f'<div class="menu-group__head"><h2 id="h-{c["id"]}">{esc(c["label"])}</h2><span data-count>{len(c["items"])} plats</span></div>{note}'
                   f'<ul class="dishes">{"".join(dish_row(d) for d in c["items"])}</ul></section>')
    return "\n".join(out)


MAP = """<div class="map reveal reveal-d1" data-map>
        <div class="map__facade">
          <span class="map__pin"><svg class="icon"><use href="#i-pin"/></svg></span>
          <p>La carte Google Maps se charge seulement si vous la demandez.</p>
          <button class="btn btn--ghost btn--sm" type="button" data-map-load>Afficher la carte</button>
        </div>
      </div>"""


def faq():
    return "\n".join(
        f'<details><summary>{esc(q)}<svg class="icon"><use href="#i-chevron"/></svg></summary><p>{esc(a)}</p></details>'
        for q, a in FAQ)


# ---------- données structurées ----------
RESTAURANT = {
    "@context": "https://schema.org", "@type": "Restaurant", "@id": SITE + "#restaurant",
    "name": "Marrouche", "url": SITE, "image": SITE + "assets/img/og-marrouche.jpg",
    "servesCuisine": ["Libanaise", "Méditerranéenne"], "priceRange": "500 – 15 000 FCFA",
    "currenciesAccepted": "XOF", "telephone": "+225 27 21 25 52 14", "acceptsReservations": True,
    "hasMenu": SITE + "menu.html",
    "address": {"@type": "PostalAddress",
                "streetAddress": "Rue Pierre et Marie Curie, angle rue Mercedes, Zone 4 C (à côté de SOCIDA)",
                "addressLocality": "Marcory, Abidjan", "addressCountry": "CI"},
    "sameAs": ["https://www.facebook.com/MarroucheAbidjan/", "https://www.instagram.com/marroucheabidjan/"],
}


def jsonld(page):
    blocks = [RESTAURANT]
    if page == "menu":
        blocks.append({
            "@context": "https://schema.org", "@type": "Menu", "name": "Carte Marrouche", "inLanguage": "fr",
            "hasMenuSection": [{
                "@type": "MenuSection", "name": c["label"],
                "hasMenuItem": [{"@type": "MenuItem", "name": d["name"], **({"description": d["desc"]} if d["desc"] else {}),
                                 "offers": {"@type": "Offer", "price": d["price"], "priceCurrency": "XOF"}} for d in c["items"]]}
                for c in MENU["categories"]]})
    if page == "infos":
        blocks.append({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ]})
    return "\n".join(f'<script type="application/ld+json">{json.dumps(b, ensure_ascii=False)}</script>' for b in blocks)


# ---------- assemblage ----------
def partial(name):
    return (SRC / "partials" / f"{name}.html").read_text(encoding="utf-8")


MACROS = [
    (re.compile(r'\[\[img (\S+) (land|port) "([^"]*)" "([^"]*)"( eager)?\]\]'),
     lambda m: img(m[1], m[2], m[3], m[4], bool(m[5]))),
    (re.compile(r'\[\[card (\S+) (\S+) (#[0-9A-Fa-f]{6}) "([^"]*)"(?: (\S+))?\]\]'),
     lambda m: card(m[1], m[2], m[3], m[4], m[5])),
    (re.compile(r'\[\[panel (\S+) (\S+) (#[0-9A-Fa-f]{6}) "([^"]*)" "([^"]*)"\]\]'), lambda m: panel(*m.groups())),
    (re.compile(r'\[\[stack (\S+) (\S+) (#[0-9A-Fa-f]{6}) "([^"]*)" "([^"]*)"\]\]'), lambda m: stack(*m.groups())),
    (re.compile(r"\[\[add (\S+)\]\]"), lambda m: add_control(DISHES[m[1]])),
    (re.compile(r"\[\[composer_data\]\]"), lambda m: composer_data()),
    (re.compile(r"\[\[categories\]\]"), lambda m: categories()),
    (re.compile(r"\[\[catnav\]\]"), lambda m: catnav()),
    (re.compile(r"\[\[menu\]\]"), lambda m: menu()),
    (re.compile(r"\[\[map\]\]"), lambda m: MAP),
    (re.compile(r"\[\[faq\]\]"), lambda m: faq()),
]


def build_page(src):
    text = src.read_text(encoding="utf-8")
    meta = json.loads(re.match(r"<!--(\{.*?\})-->", text, re.S)[1])
    body = text[text.index("-->") + 3:].strip()
    for rx, fn in MACROS:
        body = rx.sub(fn, body)
    assert "[[" not in body, f"macro inconnue dans {src.name}"
    preload = ""
    if meta.get("preload"):
        n = meta["preload"]
        preload = (f'<link rel="preload" as="image" type="image/webp" href="assets/img/{n}-800.webp" '
                   f'imagesrcset="assets/img/{n}-400.webp 400w, assets/img/{n}-800.webp 800w, assets/img/{n}-1200.webp 1200w" '
                   f'imagesizes="(min-width: 1024px) 30rem, 92vw" fetchpriority="high">')
    head = partial("head")
    for k in ("title", "description", "path", "theme"):
        head = head.replace("{{" + k + "}}", esc(meta[k]))
    head = head.replace("{{preload}}", preload)
    header = partial("header").replace("{{header_class}}", "site-header--over dark")
    for n in ("index", "menu", "reserver", "infos"):
        header = header.replace("{{cur_" + n + "}}", 'aria-current="page"' if meta["nav"] == n else "")
    page_js = {"menu": '<script src="assets/js/menu.js" defer></script>',
               "reserver": '<script src="assets/js/reserver.js" defer></script>',
               "index": '<script src="assets/vendor/gsap.min.js" defer></script>\n<script src="assets/vendor/ScrollTrigger.min.js" defer></script>\n<script src="assets/js/experience.js" defer></script>'}.get(meta["nav"], "")
    if meta["nav"] == "index":
        head = head.replace('<link rel="stylesheet" href="assets/css/site.css">', '<link rel="stylesheet" href="assets/css/site.css">\n<link rel="stylesheet" href="assets/css/experience.css">')
    return f"""<!doctype html>
<html lang="fr">
<head>
{head}
{jsonld(meta["nav"])}
</head>
<body data-page="{meta["nav"]}">
{partial("sprite")}
{header}
{body}
{partial("footer")}
{partial("actionbar")}
{partial("cart")}
<script src="assets/js/config.js" defer></script>
<script src="assets/js/menu-data.js" defer></script>
<script src="assets/js/site.js" defer></script>
{page_js}
</body>
</html>
"""


TOGGLE = """<nav aria-label="Jeu de données (développement)" style="position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:99;display:flex;gap:4px;padding:4px;border-radius:999px;background:#e5e5e5;font:600 13px system-ui">
<a href="menu.html" style="padding:6px 12px;border-radius:999px;color:#333;text-decoration:none">Démo</a>
<a href="_dev-carte-pire-cas.html" aria-current="page" style="padding:6px 12px;border-radius:999px;background:#fff;color:#111;text-decoration:none">Pire cas</a></nav>"""


def main():
    if WORST:
        page = build_page(SRC / "pages/menu.html").replace("menu-data.js", "menu-data-pire-cas.js")
        page = page.replace("<head>", '<head>\n<meta name="robots" content="noindex">', 1).replace('<body data-page="menu">', '<body data-page="menu">\n' + TOGGLE, 1)
        (ROOT / "_dev-carte-pire-cas.html").write_text(page, encoding="utf-8")
        data = {d["id"]: [d["name"], d["price"]] for d in DISHES.values()}
        (ROOT / "assets/js/menu-data-pire-cas.js").write_text(f"window.MARROUCHE_MENU = {json.dumps(data, ensure_ascii=False)};\n", encoding="utf-8")
        print("✓ _dev-carte-pire-cas.html (développement uniquement)")
        return
    for src in sorted((SRC / "pages").glob("*.html")):
        (ROOT / src.name).write_text(build_page(src), encoding="utf-8")
        print("✓", src.name)
    data = {d["id"]: [d["name"], d["price"]] for d in DISHES.values()}
    (ROOT / "assets/js/menu-data.js").write_text(
        "/* Généré par tools/build.py depuis data/menu.json — ne pas modifier à la main. id → [nom, prix FCFA] */\n"
        f"window.MARROUCHE_MENU = {json.dumps(data, ensure_ascii=False, separators=(',', ':'))};\n", encoding="utf-8")
    print("✓ assets/js/menu-data.js —", len(data), "plats")


if __name__ == "__main__":
    main()
